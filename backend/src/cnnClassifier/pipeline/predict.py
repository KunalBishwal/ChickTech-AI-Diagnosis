"""
Generic multi-disease prediction pipeline.

Supports multiple disease models through the DiseasePredictor class.
Each predictor loads its own model, class names, and recommendations.
"""

import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import os


# ─── Recommendations ─────────────────────────────────────

COCCIDIOSIS_RECOMMENDATIONS = {
    "Coccidiosis": (
        "Coccidiosis detected. Administer anticoccidial medication "
        "(e.g., Amprolium) immediately. Isolate affected birds and sanitize "
        "feeders and waterers. Consult a veterinarian for dosage guidance."
    ),
    "Healthy": (
        "No signs of coccidiosis detected. Continue maintaining good hygiene, "
        "proper nutrition, and regular health monitoring of your flock."
    ),
}

EXTERNAL_LESION_RECOMMENDATIONS = {
    "Fowlpox": (
        "Fowlpox lesions detected. There is no direct treatment — provide supportive "
        "care. Apply iodine solution to lesions, ensure clean water and nutrition, and "
        "vaccinate unaffected birds. Isolate infected birds to prevent spread."
    ),
    "Bumblefoot": (
        "Bumblefoot infection detected. Soak the affected foot in warm Epsom salt "
        "solution, carefully remove the scab and pus core, apply antibacterial "
        "ointment, and bandage securely. Improve perch surfaces and bedding. "
        "Consult a vet for severe cases."
    ),
    "Healthy": (
        "No external lesions detected. The bird appears healthy. Continue regular "
        "inspections of feet and skin, maintain clean bedding, and ensure smooth perches."
    ),
}


# ─── Generic Predictor ────────────────────────────────────

class DiseasePredictor:
    """
    Generic disease prediction pipeline.

    Args:
        model_path:       Path to .h5 model file
        class_names:      List of class names (must match training order)
        recommendations:  Dict mapping class name → recommendation string
        image_size:       Tuple (H, W) for input resizing
        confidence_threshold: Below this, return "Inconclusive"
    """

    def __init__(
        self,
        model_path: str,
        class_names: list,
        recommendations: dict,
        image_size: tuple = (224, 224),
        confidence_threshold: float = 0.6,
    ):
        self.model_path = model_path
        self.class_names = class_names
        self.recommendations = recommendations
        self.image_size = image_size
        self.confidence_threshold = confidence_threshold
        self._model = None

    @property
    def is_available(self) -> bool:
        """Check if the model file exists."""
        return os.path.isfile(self.model_path)

    def load(self):
        """Load model into memory (lazy, called once)."""
        if self._model is None:
            if not self.is_available:
                raise FileNotFoundError(
                    f"Model not found at {self.model_path}. "
                    "Please train the model first."
                )
            print(f"🔄 Loading model from {self.model_path}...")
            self._model = tf.keras.models.load_model(
                self.model_path, compile=False
            )
            print(f"✅ Model loaded: {self.model_path}")

    def predict(self, filename: str) -> dict:
        """
        Run inference on a saved image file.

        Returns:
            {
                "disease": str,
                "confidence": float,
                "recommendation": str,
                "class": str,          # backward compat
            }
        """
        self.load()

        # Preprocess — MUST match training: resize + /255.0
        img = image.load_img(filename, target_size=self.image_size)
        img_array = image.img_to_array(img)
        img_array = img_array / 255.0
        img_array = np.expand_dims(img_array, axis=0)

        # Predict
        predictions = self._model.predict(img_array)
        class_index = int(np.argmax(predictions, axis=1)[0])
        confidence = float(np.max(predictions))

        # Low-confidence handling
        if confidence < self.confidence_threshold:
            return {
                "disease": "Inconclusive",
                "confidence": confidence,
                "recommendation": (
                    "Prediction confidence is too low. Please upload a clearer, "
                    "well-lit image of the affected area for better results."
                ),
                "class": "Inconclusive",
            }

        predicted_class = self.class_names[class_index]
        recommendation = self.recommendations.get(
            predicted_class,
            "Consult a veterinarian for further diagnosis."
        )

        return {
            "disease": predicted_class,
            "confidence": confidence,
            "recommendation": recommendation,
            "class": predicted_class,       # backward compat for existing frontend
        }


# ─── Legacy Compatibility ─────────────────────────────────

class PredictionPipeline:
    """
    Original coccidiosis predictor — kept for backward compatibility.
    Wraps DiseasePredictor with the existing model path and class names.
    """

    _predictor = None

    def __init__(self, filename):
        self.filename = filename
        if PredictionPipeline._predictor is None:
            model_path = os.path.join("artifacts", "training", "model.h5")
            PredictionPipeline._predictor = DiseasePredictor(
                model_path=model_path,
                class_names=["Coccidiosis", "Healthy"],
                recommendations=COCCIDIOSIS_RECOMMENDATIONS,
                image_size=(224, 224),
                confidence_threshold=0.6,
            )

    def predict(self):
        return PredictionPipeline._predictor.predict(self.filename)
