import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

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

# Allow frontend origins (localhost + Vercel)
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3000",
     "https://chick-tech-ai-diagnosis.vercel.app"
]}})

# Environment variables
os.putenv("LANG", "en_US.UTF-8")
os.putenv("LC_ALL", "en_US.UTF-8")


# ---------------------- Model Wrapper ----------------------
class ClientApp:
    """Manages multiple disease predictors."""

    def __init__(self):
        self.filename = "inputImage.jpg"

        # Coccidiosis predictor (existing)
        self.coccidiosis = None

        # External lesion predictor (new)
        self.external_lesion = None

    def load_coccidiosis(self):
        """Load coccidiosis model once."""
        if self.coccidiosis is None:
            print("🔄 Loading coccidiosis model...")
            self.coccidiosis = PredictionPipeline(self.filename)
            print("✅ Coccidiosis model ready.")

    def load_external_lesion(self):
        """Load external lesion model once."""
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


@app.route("/predict", methods=["POST"])
def predictRoute():
    """Coccidiosis prediction (existing endpoint — backward compatible)."""
    try:
        image = request.json.get("image")
        if not image:
            return jsonify({"error": "No image provided"}), 400

        clApp.load_coccidiosis()

        decodeImage(image, clApp.filename)
        result = clApp.coccidiosis.predict()
        return jsonify(result)

    except Exception as e:
        print("❌ Coccidiosis prediction error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/predict/external-lesion", methods=["POST"])
def predictExternalLesion():
    """External lesion prediction (Fowlpox / Bumblefoot / Healthy)."""
    try:
        image = request.json.get("image")
        if not image:
            return jsonify({"error": "No image provided"}), 400

        clApp.load_external_lesion()

        decodeImage(image, clApp.filename)
        result = clApp.external_lesion.predict(clApp.filename)
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
    }), 200


# ---------------------- Model Warmup ----------------------
@app.before_request
def warmup_model_once():
    """Pre-load coccidiosis model before first request."""
    if clApp.coccidiosis is None:
        try:
            clApp.load_coccidiosis()
            print("🔥 Coccidiosis model preloaded and ready.")
        except Exception as e:
            print(f"⚠️ Model preload failed: {e}")


# ---------------------- Run Server ----------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
