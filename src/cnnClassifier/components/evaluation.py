
import tensorflow as tf
import numpy as np
from pathlib import Path
from sklearn.metrics import mean_squared_error, mean_absolute_error, f1_score, precision_score, recall_score
from cnnClassifier.entity.config_entity import EvaluationConfig
from cnnClassifier.utils.common import save_json
import math

class Evaluation:
    def __init__(self, config: EvaluationConfig):
        self.config = config
        self.valid_generator = None
        self.model = None
        self.score = None

    def _valid_generator(self):
        datagenerator_kwargs = dict(
            rescale=1. / 255,
            validation_split=0.30  # Using 30% validation split
        )

        dataflow_kwargs = dict(
            target_size=self.config.params_image_size[:-1],
            batch_size=self.config.params_batch_size,
            interpolation="bilinear",
        )

        valid_datagenerator = tf.keras.preprocessing.image.ImageDataGenerator(
            **datagenerator_kwargs
        )

        self.valid_generator = valid_datagenerator.flow_from_directory(
            directory=self.config.training_data,
            subset="validation",
            shuffle=False,
            **dataflow_kwargs
        )

    @staticmethod
    def load_model(path: Path) -> tf.keras.Model:
        """Loads the trained model safely using an absolute path."""
        return tf.keras.models.load_model(path.resolve())

    def evaluation(self):
        """Evaluates the model and computes all performance metrics."""
        # Load model and validation data
        self.model = self.load_model(Path(self.config.path_of_model))
        self._valid_generator()

        # Standard TensorFlow metrics (loss, accuracy)
        self.score = self.model.evaluate(self.valid_generator)

        # Predictions and true labels
        y_true = self.valid_generator.classes
        y_pred_probs = self.model.predict(self.valid_generator)
        y_pred = np.argmax(y_pred_probs, axis=1)

        # Compute additional metrics
        mse = mean_squared_error(y_true, y_pred)
        mae = mean_absolute_error(y_true, y_pred)
        rmse = math.sqrt(mse)
        f1 = f1_score(y_true, y_pred, average="weighted")
        precision = precision_score(y_true, y_pred, average="weighted")
        recall = recall_score(y_true, y_pred, average="weighted")

        # Save all metrics
        self.metrics = {
            "loss": float(self.score[0]),
            "accuracy": float(self.score[1]),
            "mse": float(mse),
            "mae": float(mae),
            "rmse": float(rmse),
            "f1_score": float(f1),
            "precision": float(precision),
            "recall": float(recall)
        }

    def save_score(self):
        """Save all computed metrics to scores.json."""
        save_json(path=Path("scores.json"), data=self.metrics)
