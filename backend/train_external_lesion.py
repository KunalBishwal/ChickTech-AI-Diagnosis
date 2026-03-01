"""
External Lesion Detection — Training Script
MobileNetV2 transfer learning for Fowlpox / Bumblefoot / Healthy classification.

Usage:
    cd backend
    python train_external_lesion.py

Dataset expected at:
    backend/Poultry Disease Detection.v9i.folder/
        train/  (Bumblefoot/, Fowlpox/, Healthy/)
        valid/  (Bumblefoot/, Fowlpox/, Healthy/)
        test/   (Bumblefoot/, Fowlpox/, Healthy/)

Output:
    models/external_lesion_model.h5
    models/external_lesion_metrics.json
    models/external_lesion_confusion_matrix.png
"""

import os
import json
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import MobileNetV2
from tensorflow.keras.layers import (
    GlobalAveragePooling2D, Dense, Dropout
)
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
)
from sklearn.metrics import (
    classification_report, confusion_matrix
)
from sklearn.utils.class_weight import compute_class_weight

# ─── Config ───────────────────────────────────────────────
IMG_SIZE        = (224, 224)
BATCH_SIZE      = 32
EPOCHS          = 30
LEARNING_RATE   = 1e-4
CLASS_NAMES     = ["Bumblefoot", "Fowlpox", "Healthy"]   # alphabetical = ImageDataGenerator order
DATASET_ROOT    = os.path.join(
    os.path.dirname(__file__),
    "Poultry Disease Detection.v9i.folder"
)
OUTPUT_DIR      = os.path.join(os.path.dirname(__file__), "models")
MODEL_PATH      = os.path.join(OUTPUT_DIR, "external_lesion_model.h5")

os.makedirs(OUTPUT_DIR, exist_ok=True)


# ─── Data Generators ─────────────────────────────────────
def create_generators():
    """Create train/valid/test generators with augmentation."""
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        rotation_range=20,
        width_shift_range=0.1,
        height_shift_range=0.1,
        zoom_range=0.1,
        brightness_range=[0.8, 1.2],
        horizontal_flip=True,
    )

    eval_datagen = ImageDataGenerator(rescale=1.0 / 255)

    common_kwargs = dict(
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        classes=CLASS_NAMES,        # explicit order
        interpolation="bilinear",
    )

    train_gen = train_datagen.flow_from_directory(
        os.path.join(DATASET_ROOT, "train"),
        shuffle=True,
        **common_kwargs,
    )

    valid_gen = eval_datagen.flow_from_directory(
        os.path.join(DATASET_ROOT, "valid"),
        shuffle=False,
        **common_kwargs,
    )

    test_gen = eval_datagen.flow_from_directory(
        os.path.join(DATASET_ROOT, "test"),
        shuffle=False,
        **common_kwargs,
    )

    return train_gen, valid_gen, test_gen


# ─── Model ────────────────────────────────────────────────
def build_model():
    """MobileNetV2 + classification head."""
    base = MobileNetV2(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False   # freeze backbone first

    x = base.output
    x = GlobalAveragePooling2D()(x)
    x = Dense(128, activation="relu")(x)
    x = Dropout(0.3)(x)
    out = Dense(len(CLASS_NAMES), activation="softmax")(x)

    model = Model(inputs=base.input, outputs=out)
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )
    model.summary()
    return model


# ─── Class Weights ────────────────────────────────────────
def get_class_weights(generator):
    """Compute class weights to handle imbalance."""
    labels = generator.classes
    weights = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(labels),
        y=labels,
    )
    return dict(enumerate(weights))


# ─── Evaluation ───────────────────────────────────────────
def evaluate_model(model, test_gen):
    """Generate confusion matrix, precision, recall, F1."""
    print("\n[EVAL] Evaluating on test set...")

    test_gen.reset()
    y_pred_probs = model.predict(test_gen, steps=len(test_gen))
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = test_gen.classes[:len(y_pred)]

    # Classification report
    report = classification_report(
        y_true, y_pred,
        target_names=CLASS_NAMES,
        output_dict=True,
    )
    print("\n" + classification_report(y_true, y_pred, target_names=CLASS_NAMES))

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    print("Confusion Matrix:")
    print(cm)

    # Save metrics JSON
    metrics = {
        "accuracy": float(report["accuracy"]),
        "per_class": {
            name: {
                "precision": round(report[name]["precision"], 4),
                "recall": round(report[name]["recall"], 4),
                "f1-score": round(report[name]["f1-score"], 4),
                "support": int(report[name]["support"]),
            }
            for name in CLASS_NAMES
        },
        "confusion_matrix": cm.tolist(),
    }
    metrics_path = os.path.join(OUTPUT_DIR, "external_lesion_metrics.json")
    with open(metrics_path, "w") as f:
        json.dump(metrics, f, indent=2)
    print(f"[OK] Metrics saved to {metrics_path}")

    # Plot confusion matrix
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns

        fig, ax = plt.subplots(figsize=(8, 6))
        sns.heatmap(
            cm, annot=True, fmt="d", cmap="Blues",
            xticklabels=CLASS_NAMES, yticklabels=CLASS_NAMES, ax=ax
        )
        ax.set_xlabel("Predicted")
        ax.set_ylabel("True")
        ax.set_title("External Lesion Detection — Confusion Matrix")
        fig_path = os.path.join(OUTPUT_DIR, "external_lesion_confusion_matrix.png")
        fig.savefig(fig_path, dpi=150, bbox_inches="tight")
        plt.close(fig)
        print(f"[OK] Confusion matrix plot saved to {fig_path}")
    except ImportError:
        print("[WARN] matplotlib/seaborn not available -- skipping plot")

    return metrics


# ─── Main ─────────────────────────────────────────────────
def main():
    print("[TRAIN] External Lesion Detection -- Training Pipeline")
    print(f"   Dataset:  {DATASET_ROOT}")
    print(f"   Output:   {MODEL_PATH}")
    print(f"   Classes:  {CLASS_NAMES}")
    print()

    # 1. Create data generators
    train_gen, valid_gen, test_gen = create_generators()
    print(f"   Train samples: {train_gen.samples}")
    print(f"   Valid samples: {valid_gen.samples}")
    print(f"   Test samples:  {test_gen.samples}")

    # 2. Compute class weights
    class_weights = get_class_weights(train_gen)
    print(f"   Class weights: {class_weights}")

    # 3. Build model
    model = build_model()

    # 4. Callbacks
    callbacks = [
        EarlyStopping(
            monitor="val_loss", patience=5,
            restore_best_weights=True, verbose=1
        ),
        ReduceLROnPlateau(
            monitor="val_loss", factor=0.5,
            patience=3, min_lr=1e-7, verbose=1
        ),
        ModelCheckpoint(
            MODEL_PATH, monitor="val_accuracy",
            save_best_only=True, verbose=1
        ),
    ]

    # 5. Train (frozen backbone)
    print("\n[PHASE 1] Training with frozen backbone...")
    model.fit(
        train_gen,
        epochs=EPOCHS,
        validation_data=valid_gen,
        class_weight=class_weights,
        callbacks=callbacks,
    )

    # 6. Fine-tune: unfreeze top layers
    print("\n[PHASE 2] Fine-tuning top layers...")

    # Find the MobileNetV2 backbone — it may be nested as a Functional model
    base_model = None
    for layer in model.layers:
        if hasattr(layer, 'layers') and len(layer.layers) > 10:
            base_model = layer
            break

    if base_model is not None:
        # Unfreeze last 30 layers of the nested backbone
        for layer in base_model.layers[-30:]:
            layer.trainable = True
    else:
        # Fallback: unfreeze last 30 layers of the entire model
        for layer in model.layers[-30:]:
            layer.trainable = True

    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE / 10),
        loss="categorical_crossentropy",
        metrics=["accuracy"],
    )

    model.fit(
        train_gen,
        epochs=15,
        validation_data=valid_gen,
        class_weight=class_weights,
        callbacks=[
            EarlyStopping(
                monitor="val_loss", patience=4,
                restore_best_weights=True, verbose=1
            ),
            ModelCheckpoint(
                MODEL_PATH, monitor="val_accuracy",
                save_best_only=True, verbose=1
            ),
        ],
    )

    # 7. Save final model
    model.save(MODEL_PATH)
    print(f"\n[OK] Model saved to {MODEL_PATH}")

    # 8. Evaluate
    evaluate_model(model, test_gen)

    print("\n[DONE] Training complete!")


if __name__ == "__main__":
    main()
