import sys
import os
import gc
import hashlib
import base64
import re
import requests as http_requests
from flask import Flask, request, jsonify, make_response
from dotenv import load_dotenv
from cachetools import LRUCache

# Load environment variables from .env
load_dotenv()

# Add src path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from cnnClassifier.utils.common import decodeImage
from cnnClassifier.pipeline.predict import (
    PredictionPipeline,
    DiseasePredictor,
    EXTERNAL_LESION_RECOMMENDATIONS,
)

# ---------------------- Flask Setup ----------------------
app = Flask(__name__)


# ─── Manual CORS (bulletproof — works even if flask-cors breaks) ───
@app.after_request
def add_cors_headers(response):
    """Add CORS headers to EVERY response, including errors and preflight."""
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type"
    response.headers["Access-Control-Max-Age"] = "3600"
    return response


@app.before_request
def handle_preflight():
    """Explicitly handle CORS preflight (OPTIONS) requests."""
    if request.method == "OPTIONS":
        resp = make_response("", 204)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type"
        resp.headers["Access-Control-Max-Age"] = "3600"
        return resp


# Environment variables
os.putenv("LANG", "en_US.UTF-8")
os.putenv("LC_ALL", "en_US.UTF-8")

# Sarvam AI API keys (loaded from .env)
SARVAM_TRANSLATE_KEY = os.getenv("SARVAM_API_KEY_TRANSLATE", "")
SARVAM_STT_KEY = os.getenv("SARVAM_API_KEY_STT", "")

# ─── Translation cache (LRU, max 500 entries) ───
# Key: hash(text + target_lang), Value: translated_text
translation_cache = LRUCache(maxsize=500)

# ─── TTS cache (LRU, max 100 entries) ───
# Key: hash(text + lang), Value: base64 audio string
tts_cache = LRUCache(maxsize=100)


# ---------------------- Model Wrapper ----------------------
class ClientApp:
    """Manages multiple disease predictors with memory-aware loading."""

    def __init__(self):
        self.filename = "inputImage.jpg"
        self.coccidiosis = None
        self.external_lesion = None

    def load_coccidiosis(self):
        """Load coccidiosis model (lazy)."""
        if self.coccidiosis is None:
            print("🔄 Loading coccidiosis model...")
            self.coccidiosis = PredictionPipeline(self.filename)
            print("✅ Coccidiosis model ready.")

    def load_external_lesion(self):
        """Load external lesion model (lazy)."""
        if self.external_lesion is None:
            model_path = os.path.join("models", "external_lesion_model.h5")
            print(f"🔄 Loading external lesion model from {model_path}...")
            self.external_lesion = DiseasePredictor(
                model_path=model_path,
                class_names=["Bumblefoot", "Fowlpox", "Healthy"],
                recommendations=EXTERNAL_LESION_RECOMMENDATIONS,
                image_size=(224, 224),
                confidence_threshold=0.6,
            )
            self.external_lesion.load()
            print("✅ External lesion model ready.")


# Create global instance
clApp = ClientApp()


# ---------------------- Routes ----------------------

@app.route("/train", methods=["GET", "POST"])
def trainRoute():
    os.system("dvc repro --force")
    return jsonify({"message": "Training done successfully!"})


@app.route("/predict", methods=["POST", "OPTIONS"])
def predictRoute():
    """Coccidiosis prediction (existing endpoint — backward compatible)."""
    try:
        image = request.json.get("image")
        if not image:
            return jsonify({"error": "No image provided"}), 400

        clApp.load_coccidiosis()

        decodeImage(image, clApp.filename)
        result = clApp.coccidiosis.predict()

        # Free memory after prediction
        gc.collect()

        return jsonify(result)

    except Exception as e:
        print("❌ Coccidiosis prediction error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/predict/external-lesion", methods=["POST", "OPTIONS"])
def predictExternalLesion():
    """External lesion prediction (Fowlpox / Bumblefoot / Healthy)."""
    try:
        image = request.json.get("image")
        if not image:
            return jsonify({"error": "No image provided"}), 400

        clApp.load_external_lesion()

        decodeImage(image, clApp.filename)
        result = clApp.external_lesion.predict(clApp.filename)

        # Free memory after prediction
        gc.collect()

        return jsonify(result)

    except FileNotFoundError as e:
        print("⚠️ External lesion model not found:", e)
        return jsonify({
            "error": "External lesion model not yet available. Please train the model first.",
            "disease": "Unavailable",
            "confidence": 0.0,
            "recommendation": "The external lesion detection model has not been trained yet.",
        }), 503

    except Exception as e:
        print("❌ External lesion prediction error:", e)
        return jsonify({"error": str(e)}), 500


# ---------------------- Sarvam AI: Translation ----------------------

@app.route("/translate", methods=["POST", "OPTIONS"])
def translateRoute():
    """Proxy translation through Sarvam AI (mayura:v1) with LRU caching."""
    try:
        data = request.json
        text = (data or {}).get("text", "").strip()
        source_lang = (data or {}).get("source_lang", "en-IN")
        target_lang = (data or {}).get("target_lang", "hi-IN")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        if not SARVAM_TRANSLATE_KEY:
            return jsonify({"error": "Translation API key not configured"}), 500

        # Check cache first (keyed on text hash + target language)
        cache_key = hashlib.md5(f"{text}::{target_lang}".encode()).hexdigest()
        if cache_key in translation_cache:
            print(f"✅ Translation cache HIT for '{text[:30]}...' -> {target_lang}")
            return jsonify({"translated_text": translation_cache[cache_key]})

        # Call Sarvam AI Translate API
        print(f"🌐 Translating '{text[:50]}...' from {source_lang} -> {target_lang}")
        response = http_requests.post(
            "https://api.sarvam.ai/translate",
            headers={
                "Content-Type": "application/json",
                "api-subscription-key": SARVAM_TRANSLATE_KEY,
            },
            json={
                "input": text,
                "source_language_code": source_lang,
                "target_language_code": target_lang,
                "model": "mayura:v1",
                "enable_preprocessing": True,
            },
            timeout=15,
        )

        if response.status_code != 200:
            print(f"❌ Sarvam translate error: {response.status_code} {response.text}")
            return jsonify({"error": f"Translation service error: {response.status_code}"}), 502

        result = response.json()
        translated = result.get("translated_text", "")

        # Store in cache
        translation_cache[cache_key] = translated
        print(f"✅ Translation cached. Cache size: {len(translation_cache)}/500")

        return jsonify({"translated_text": translated})

    except http_requests.exceptions.Timeout:
        return jsonify({"error": "Translation service timed out"}), 504
    except Exception as e:
        print(f"❌ Translation error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/translate-batch", methods=["POST", "OPTIONS"])
def translateBatchRoute():
    """Batch pseudo-translation by joining with ### to save Sarvam API calls. Reduces time from 30s to 2s."""
    if request.method == "OPTIONS":
        return "", 200

    data = request.json
    if not data or "texts" not in data:
        return jsonify({"error": "No texts provided"}), 400

    texts = data.get("texts", [])
    source_lang = data.get("source_lang", "en-IN")
    target_lang = data.get("target_lang", "hi-IN")

    if not texts:
        return jsonify({"translated_texts": []})
        
    results = [None] * len(texts)
    uncached_indices = []
    uncached_texts = []
    
    # Process cache first
    for i, t in enumerate(texts):
        if not t.strip() or target_lang == "en-IN":
            results[i] = t
            continue
            
        key = f"{target_lang}::{t}"
        if key in translation_cache:
            results[i] = translation_cache[key]
        else:
            uncached_indices.append(i)
            uncached_texts.append(t)
            
    if uncached_texts:
        # We join with \n\n###\n\n which Mayura:v1 preserves
        delimiter_join = "\n\n###\n\n"
        combined_text = delimiter_join.join(uncached_texts)
        
        try:
            print(f"🌐 Translating batch of {len(uncached_texts)} strings from {source_lang} -> {target_lang}")
            response = http_requests.post(
                "https://api.sarvam.ai/translate",
                headers={
                    "Content-Type": "application/json",
                    "api-subscription-key": SARVAM_TRANSLATE_KEY,
                },
                json={
                    "input": combined_text,
                    "source_language_code": source_lang,
                    "target_language_code": target_lang,
                    "model": "mayura:v1",
                    "enable_preprocessing": True,
                },
                timeout=30,
            )
            
            if response.status_code == 200:
                result_json = response.json()
                translated_combined = result_json.get("translated_text", "")
                
                # Split by ### ignoring surrounding whitespace
                parts = re.split(r'\s*###\s*', translated_combined)
                
                if len(parts) == len(uncached_texts):
                    for idx, orig_index in enumerate(uncached_indices):
                        translated_text = parts[idx].strip()
                        results[orig_index] = translated_text
                        
                        # Cache it
                        key = f"{target_lang}::{uncached_texts[idx]}"
                        translation_cache[key] = translated_text
                    print(f"✅ Batch translation successful. Cache size: {len(translation_cache)}/500")
                else:
                    print(f"⚠️ Batch split mismatch: Expected {len(uncached_texts)}, got {len(parts)}. Falling back to original.")
                    for idx, orig_index in enumerate(uncached_indices):
                        results[orig_index] = uncached_texts[idx]
            else:
                print(f"❌ Batch translate error: {response.status_code} {response.text}")
                for idx, orig_index in enumerate(uncached_indices):
                    results[orig_index] = uncached_texts[idx]
                    
        except Exception as e:
            print(f"❌ Batch translation error: {e}")
            for idx, orig_index in enumerate(uncached_indices):
                results[orig_index] = uncached_texts[idx]
                
    return jsonify({"translated_texts": results})


# ---------------------- Sarvam AI: Speech-to-Text ----------------------

MAX_AUDIO_SIZE = 5 * 1024 * 1024  # 5 MB

@app.route("/transcribe", methods=["POST", "OPTIONS"])
def transcribeRoute():
    """Proxy speech-to-text through Sarvam AI (saaras:v3)."""
    try:
        if "audio" not in request.files:
            return jsonify({"error": "No audio file provided"}), 400

        audio_file = request.files["audio"]

        # Read audio bytes and check size
        audio_bytes = audio_file.read()
        if len(audio_bytes) > MAX_AUDIO_SIZE:
            return jsonify({"error": "Audio file too large (max 5 MB)"}), 413

        if not SARVAM_STT_KEY:
            return jsonify({"error": "STT API key not configured"}), 500

        # Determine filename and content type
        filename = audio_file.filename or "audio.webm"
        content_type = audio_file.content_type or "audio/webm"

        print(f"🎙️ Transcribing audio: {filename} ({len(audio_bytes)} bytes, {content_type})")

        # Call Sarvam AI Speech-to-Text API
        response = http_requests.post(
            "https://api.sarvam.ai/speech-to-text",
            headers={
                "api-subscription-key": SARVAM_STT_KEY,
            },
            files={
                "file": (filename, audio_bytes, content_type),
            },
            data={
                "model": "saaras:v3",
                "language_code": "unknown",
            },
            timeout=30,
        )

        if response.status_code != 200:
            print(f"❌ Sarvam STT error: {response.status_code} {response.text}")
            return jsonify({"error": f"Transcription service error: {response.status_code}"}), 502

        result = response.json()
        transcript = result.get("transcript", "")
        lang_code = result.get("language_code", "unknown")

        print(f"✅ Transcribed: '{transcript[:80]}...' (lang: {lang_code})")

        return jsonify({
            "transcript": transcript,
            "language_code": lang_code,
        })

    except http_requests.exceptions.Timeout:
        return jsonify({"error": "Transcription service timed out"}), 504
    except Exception as e:
        print(f"❌ Transcription error: {e}")
        return jsonify({"error": str(e)}), 500

# ---------------------- Sarvam AI: Text-to-Speech ----------------------

SARVAM_TTS_VOICES = {
    "hi-IN": "anushka",
    "ta-IN": "shruti",
    "te-IN": "kavitha",
    "bn-IN": "arya",
    "kn-IN": "vidya",
    "mr-IN": "manisha",
    "gu-IN": "priya",
    "ml-IN": "suhani",
    "pa-IN": "simran",  # fallback
    "od-IN": "pooja",    # fallback
    "en-IN": "anushka",
}

@app.route("/tts", methods=["POST", "OPTIONS"])
def ttsRoute():
    """Convert text to speech using Sarvam AI (bulbul:v2) with LRU caching."""
    try:
        data = request.json
        text = (data or {}).get("text", "").strip()
        lang = (data or {}).get("lang", "hi-IN")

        if not text:
            return jsonify({"error": "No text provided"}), 400

        if not SARVAM_STT_KEY:
            return jsonify({"error": "TTS API key not configured"}), 500

        # Max text length ~500 chars (Sarvam limit)
        if len(text) > 500:
            text = text[:497] + "..."

        # Cache check
        cache_key = hashlib.md5(f"{text}::{lang}".encode()).hexdigest()
        if cache_key in tts_cache:
            print(f"✅ TTS cache HIT for lang={lang}, len={len(text)}")
            return jsonify({"audio_base64": tts_cache[cache_key]})

        voice = SARVAM_TTS_VOICES.get(lang, "meera")
        print(f"🔊 TTS: lang={lang}, voice={voice}, len={len(text)} chars")

        response = http_requests.post(
            "https://api.sarvam.ai/text-to-speech",
            headers={
                "Content-Type": "application/json",
                "api-subscription-key": SARVAM_STT_KEY,
            },
            json={
                "inputs": [text],
                "target_language_code": lang,
                "speaker": voice,
                "model": "bulbul:v2",
                "enable_preprocessing": True,
            },
            timeout=20,
        )

        if response.status_code != 200:
            print(f"❌ Sarvam TTS error: {response.status_code} {response.text}")
            return jsonify({"error": f"TTS service error: {response.status_code}"}), 502

        result = response.json()
        # Sarvam returns audios array with base64 strings
        audios = result.get("audios", [])
        if not audios:
            return jsonify({"error": "No audio returned from TTS service"}), 502

        audio_b64 = audios[0]  # already base64 encoded WAV

        # Store in cache
        tts_cache[cache_key] = audio_b64
        print(f"✅ TTS cached. Cache size: {len(tts_cache)}/100")

        return jsonify({"audio_base64": audio_b64})

    except http_requests.exceptions.Timeout:
        return jsonify({"error": "TTS service timed out"}), 504
    except Exception as e:
        print(f"❌ TTS error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------------------- Health ----------------------

@app.route("/health", methods=["GET"])
def health():
    """Health check endpoint."""
    external_model_path = os.path.join("models", "external_lesion_model.h5")
    return jsonify({
        "status": "ok",
        "models": {
            "coccidiosis": os.path.isfile(
                os.path.join("artifacts", "training", "model.h5")
            ),
            "external_lesion": os.path.isfile(external_model_path),
        },
        "sarvam": {
            "translate_configured": bool(SARVAM_TRANSLATE_KEY),
            "stt_configured": bool(SARVAM_STT_KEY),
            "translation_cache_size": len(translation_cache),
        },
    }), 200


# ---------------------- Run Server ----------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
