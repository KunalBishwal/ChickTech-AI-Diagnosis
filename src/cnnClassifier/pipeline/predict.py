import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing import image
import os

class PredictionPipeline:
    # load the model only once
    _model = None

    def __init__(self, filename):
        self.filename = filename
        if PredictionPipeline._model is None:
            model_path = os.path.join("artifacts", "training", "model.h5")
            PredictionPipeline._model = tf.keras.models.load_model(model_path)
            print(f"✅ Model loaded from: {model_path}")

        # define class order same as training data folder names
        self.class_names = ["Coccidiosis", "Healthy"]

    def predict(self):
        # preprocess image
        img = image.load_img(self.filename, target_size=(224, 224))
        img_array = image.img_to_array(img)
        img_array = img_array / 255.0  # ✅ normalize pixel values
        img_array = np.expand_dims(img_array, axis=0)

        # make prediction
        predictions = PredictionPipeline._model.predict(img_array)
        class_index = np.argmax(predictions, axis=1)[0]
        confidence = float(np.max(predictions))

        # get class name
        predicted_class = self.class_names[class_index]

        # return clean JSON format
        return {"class": predicted_class, "confidence": confidence}
