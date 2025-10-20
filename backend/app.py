################################### REACT APP ###########################################
import sys
import os
from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from cnnClassifier.utils.common import decodeImage
from cnnClassifier.pipeline.predict import PredictionPipeline

# --- Ensure Python finds your 'src' package ---
sys.path.append(os.path.join(os.path.dirname(__file__), "src"))

# --- Flask setup ---
app = Flask(__name__)
CORS(app)  # allows cross-origin requests from your frontend (Vercel)

# --- Locale environment (for some ML libs) ---
os.putenv("LANG", "en_US.UTF-8")
os.putenv("LC_ALL", "en_US.UTF-8")


# --- Core logic class ---
class ClientApp:
    def __init__(self):
        self.filename = "inputImage.jpg"
        self.classifier = PredictionPipeline(self.filename)


# --- Instantiate classifier once ---
clApp = ClientApp()


@app.route("/train", methods=["GET", "POST"])
@cross_origin()
def trainRoute():
    """Triggers DVC pipeline retraining (Render optional)."""
    os.system("dvc repro --force")
    return jsonify({"message": "Training done successfully!"})


@app.route("/predict", methods=["POST"])
@cross_origin()
def predictRoute():
    """Receives an image and returns AI prediction."""
    try:
        image = request.json.get("image")
        if not image:
            return jsonify({"error": "No image provided"}), 400

        decodeImage(image, clApp.filename)
        result = clApp.classifier.predict()
        return jsonify(result)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/health", methods=["GET"])
def health():
    """Simple health check for Render uptime ping."""
    return jsonify({"status": "ok"}), 200


# --- Main entry point ---
if __name__ == "__main__":
    # Render sets PORT automatically, fallback to 8080 locally
    port = int(os.environ.get("PORT", 8080))
    app.run(host="0.0.0.0", port=port, debug=False)
