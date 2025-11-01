# import sys
# import os
# from flask import Flask, request, jsonify
# from flask_cors import CORS, cross_origin

# sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

# from cnnClassifier.utils.common import decodeImage
# from cnnClassifier.pipeline.predict import PredictionPipeline

# # app = Flask(__name__)
# # CORS(app)
# app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://chicktech-ai.vercel.app"]}})
# os.putenv("LANG", "en_US.UTF-8")
# os.putenv("LC_ALL", "en_US.UTF-8")


# class ClientApp:
#     def __init__(self):
#         self.filename = "inputImage.jpg"
#         self.classifier = PredictionPipeline(self.filename)


# clApp = ClientApp()


# @app.route("/train", methods=["GET", "POST"])
# @cross_origin()
# def trainRoute():
#     os.system("dvc repro --force")
#     return jsonify({"message": "Training done successfully!"})


# @app.route("/predict", methods=["POST"])
# @cross_origin()
# def predictRoute():
#     try:
#         image = request.json.get("image")
#         if not image:
#             return jsonify({"error": "No image provided"}), 400

#         decodeImage(image, clApp.filename)
#         result = clApp.classifier.predict()
#         return jsonify(result)

#     except Exception as e:
#         return jsonify({"error": str(e)}), 500


# @app.route("/health", methods=["GET"])
# def health():
#     return jsonify({"status": "ok"}), 200


# if __name__ == "__main__":
#     port = int(os.environ.get("PORT", 8080))
#     app.run(host="0.0.0.0", port=port, debug=False)



import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS

# Add src path
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

from cnnClassifier.utils.common import decodeImage
from cnnClassifier.pipeline.predict import PredictionPipeline

# ---------------------- Flask Setup ----------------------
app = Flask(__name__)

# Allow frontend origins (localhost + Vercel)
CORS(app, resources={r"/*": {"origins": [
    "http://localhost:3000",
    "https://chicktech-ai.vercel.app"
]}})

# Environment variables
os.putenv("LANG", "en_US.UTF-8")
os.putenv("LC_ALL", "en_US.UTF-8")


# ---------------------- Model Wrapper ----------------------
class ClientApp:
    def __init__(self):
        self.filename = "inputImage.jpg"
        self.classifier = None  # Lazy load only once

    def load_model(self):
        """Load model once and reuse for later predictions."""
        if self.classifier is None:
            print("🔄 Loading TensorFlow model into memory...")
            self.classifier = PredictionPipeline(self.filename)
            print("✅ Model loaded successfully.")


# Create global instance
clApp = ClientApp()


# ---------------------- Routes ----------------------

@app.route("/train", methods=["GET", "POST"])
def trainRoute():
    os.system("dvc repro --force")
    return jsonify({"message": "Training done successfully!"})


@app.route("/predict", methods=["POST"])
def predictRoute():
    try:
        image = request.json.get("image")
        if not image:
            return jsonify({"error": "No image provided"}), 400

        clApp.load_model()  # Load once, reuse

        decodeImage(image, clApp.filename)
        result = clApp.classifier.predict()
        return jsonify(result)

    except Exception as e:
        print("❌ Prediction error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"}), 200


# ---------------------- Model Warmup (Flask 3.x compatible) ----------------------
@app.before_request
def warmup_model_once():
    """Ensures model loads only before the first real request."""
    if clApp.classifier is None:
        try:
            clApp.load_model()
            print("🔥 Model preloaded and ready.")
        except Exception as e:
            print(f"⚠️ Model preload failed: {e}")


# ---------------------- Run Server ----------------------
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)


