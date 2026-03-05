"""
Coccidiosis Detection — Standalone Retraining Script (v2)
VGG16 transfer learning for Coccidiosis / Healthy classification.

SAFETY: Backs up the existing model before overwriting.
        If the new model performs worse, the backup is preserved.

Key improvements over the original DVC pipeline:
  - Standalone script (no config.yaml / params.yaml dependency)
  - Proper classification head: GlobalAveragePooling2D + BatchNorm + Dropout
  - 3-phase progressive unfreezing
  - Heavy data augmentation for real-world generalization
  - Label smoothing to prevent overconfident predictions
  - EarlyStopping + ReduceLROnPlateau callbacks
  - Class weights for any imbalance
  - Automatic model backup before overwriting

Usage:
    cd backend
    python train_coccidiosis.py

Dataset expected at:
    backend/Coccidiosis/
        cocci/    (coccidiosis images)
        healthy/  (healthy images)

Output:
    artifacts/training/model.h5          (replaces existing model)
    models/coccidiosis_metrics.json      (per-class metrics)
    models/coccidiosis_confusion_matrix.png
"""

import os
import json
import shutil
import numpy as np
import tensorflow as tf
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from tensorflow.keras.applications import VGG16
from tensorflow.keras.layers import (
    GlobalAveragePooling2D, Dense, Dropout, BatchNormalization
)
from tensorflow.keras.models import Model
from tensorflow.keras.optimizers import Adam
from tensorflow.keras.callbacks import (
    EarlyStopping, ReduceLROnPlateau, ModelCheckpoint
)
from sklearn.metrics import classification_report, confusion_matrix
from sklearn.utils.class_weight import compute_class_weight

# ─── Config ───────────────────────────────────────────────
IMG_SIZE        = (224, 224)
BATCH_SIZE      = 16
EPOCHS_PHASE1   = 20       # Frozen backbone
EPOCHS_PHASE2   = 25       # Fine-tune top 4 conv blocks
EPOCHS_PHASE3   = 15       # Deep fine-tune
LEARNING_RATE   = 1e-4
CLASS_NAMES     = ["Coccidiosis", "Healthy"]   # alphabetical = flow_from_directory order
# Note: flow_from_directory sorts folders alphabetically:
#   cocci -> index 0 (Coccidiosis)
#   healthy -> index 1 (Healthy)
DATASET_ROOT    = os.path.join(os.path.dirname(__file__), "Coccidiosis")
OUTPUT_DIR      = os.path.join(os.path.dirname(__file__), "models")
ARTIFACTS_DIR   = os.path.join(os.path.dirname(__file__), "artifacts", "training")
MODEL_PATH      = os.path.join(ARTIFACTS_DIR, "model.h5")
BACKUP_PATH     = os.path.join(ARTIFACTS_DIR, "model.h5.backup")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(ARTIFACTS_DIR, exist_ok=True)


# ─── Data Generators ─────────────────────────────────────
def create_generators():
    """
    Create train/val generators with heavy augmentation.
    Uses 85/15 split from a single directory.
    """
    train_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=0.15,
        rotation_range=40,
        width_shift_range=0.2,
        height_shift_range=0.2,
        shear_range=0.2,
        zoom_range=0.25,
        brightness_range=[0.7, 1.3],
        channel_shift_range=25,
        horizontal_flip=True,
        vertical_flip=True,
        fill_mode="reflect",
    )

    eval_datagen = ImageDataGenerator(
        rescale=1.0 / 255,
        validation_split=0.15,
    )

    common_kwargs = dict(
        target_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        class_mode="categorical",
        interpolation="bilinear",
    )

    train_gen = train_datagen.flow_from_directory(
        DATASET_ROOT,
        subset="training",
        shuffle=True,
        **common_kwargs,
    )

    val_gen = eval_datagen.flow_from_directory(
        DATASET_ROOT,
        subset="validation",
        shuffle=False,
        **common_kwargs,
    )

    # Print discovered class mapping
    print(f"   Class indices: {train_gen.class_indices}")

    return train_gen, val_gen


# ─── Model ────────────────────────────────────────────────
def build_model():
    """
    VGG16 + improved classification head.
    Replaces Flatten() with GlobalAveragePooling2D (100x fewer params).
    """
    base = VGG16(
        input_shape=(*IMG_SIZE, 3),
        include_top=False,
        weights="imagenet",
    )
    base.trainable = False   # freeze backbone first

    x = base.output
    x = GlobalAveragePooling2D()(x)        # instead of Flatten (huge overfitting reduction)
    x = Dense(256, activation="relu")(x)
    x = BatchNormalization()(x)
    x = Dropout(0.4)(x)
    x = Dense(128, activation="relu")(x)
    x = BatchNormalization()(x)
    x = Dropout(0.3)(x)
    out = Dense(len(CLASS_NAMES), activation="softmax")(x)

    model = Model(inputs=base.input, outputs=out)
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
        metrics=["accuracy"],
    )
    model.summary()
    return model


# ─── Class Weights ────────────────────────────────────────
def get_class_weights(generator):
    """Compute balanced class weights."""
    labels = generator.classes
    weights = compute_class_weight(
        class_weight="balanced",
        classes=np.unique(labels),
        y=labels,
    )
    cw = dict(enumerate(weights))
    print(f"   Class weights: {cw}")
    return cw


# ─── Unfreeze Utility ────────────────────────────────────
def unfreeze_layers(model, num_layers):
    """Unfreeze the last `num_layers` of the VGG16 backbone."""
    base_model = None
    for layer in model.layers:
        if hasattr(layer, 'layers') and len(layer.layers) > 10:
            base_model = layer
            break

    target = base_model if base_model is not None else model

    unfrozen = 0
    for layer in target.layers[-num_layers:]:
        if not isinstance(layer, tf.keras.layers.BatchNormalization):
            layer.trainable = True
            unfrozen += 1
    print(f"   Unfroze {unfrozen} layers (skipped BatchNorm)")


# ─── Evaluation ───────────────────────────────────────────
def evaluate_model(model, val_gen):
    """Generate confusion matrix, precision, recall, F1."""
    print("\n[EVAL] Evaluating on validation set...")

    val_gen.reset()
    y_pred_probs = model.predict(val_gen, steps=len(val_gen))
    y_pred = np.argmax(y_pred_probs, axis=1)
    y_true = val_gen.classes[:len(y_pred)]

    # Remap class indices to CLASS_NAMES correctly
    idx_to_class = {v: k for k, v in val_gen.class_indices.items()}
    # Map folder names to our CLASS_NAMES
    folder_to_name = {"cocci": "Coccidiosis", "healthy": "Healthy"}
    actual_class_names = [folder_to_name.get(idx_to_class[i], idx_to_class[i])
                          for i in range(len(idx_to_class))]

    report = classification_report(
        y_true, y_pred,
        target_names=actual_class_names,
        output_dict=True,
    )
    print("\n" + classification_report(y_true, y_pred, target_names=actual_class_names))

    cm = confusion_matrix(y_true, y_pred)
    print("Confusion Matrix:")
    print(cm)

    metrics = {
        "accuracy": float(report["accuracy"]),
        "per_class": {
            name: {
                "precision": round(report[name]["precision"], 4),
                "recall": round(report[name]["recall"], 4),
                "f1-score": round(report[name]["f1-score"], 4),
                "support": int(report[name]["support"]),
            }
            for name in actual_class_names
        },
        "confusion_matrix": cm.tolist(),
    }
    metrics_path = os.path.join(OUTPUT_DIR, "coccidiosis_metrics.json")
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
            xticklabels=actual_class_names, yticklabels=actual_class_names, ax=ax
        )
        ax.set_xlabel("Predicted")
        ax.set_ylabel("True")
        ax.set_title("Coccidiosis Detection — Confusion Matrix (v2)")
        fig_path = os.path.join(OUTPUT_DIR, "coccidiosis_confusion_matrix.png")
        fig.savefig(fig_path, dpi=150, bbox_inches="tight")
        plt.close(fig)
        print(f"[OK] Confusion matrix plot saved to {fig_path}")
    except ImportError:
        print("[WARN] matplotlib/seaborn not available — skipping plot")

    return metrics


# ─── Backup Existing Model ───────────────────────────────
def backup_existing_model():
    """Create backup of existing model before overwriting."""
    if os.path.isfile(MODEL_PATH):
        print(f"[BACKUP] Backing up existing model to {BACKUP_PATH}")
        shutil.copy2(MODEL_PATH, BACKUP_PATH)
        print(f"[BACKUP] Backup created. If new model is worse, restore from: {BACKUP_PATH}")
    else:
        print("[BACKUP] No existing model found — skipping backup.")


# ─── Main ─────────────────────────────────────────────────
def main():
    print("=" * 60)
    print("[TRAIN v2] Coccidiosis Detection — Improved Retraining")
    print("=" * 60)
    print(f"   Dataset:  {DATASET_ROOT}")
    print(f"   Output:   {MODEL_PATH}")
    print(f"   Classes:  {CLASS_NAMES}")
    print()

    # 0. Safety backup
    backup_existing_model()

    # 1. Create data generators
    train_gen, val_gen = create_generators()
    print(f"   Train samples: {train_gen.samples}")
    print(f"   Val samples:   {val_gen.samples}")

    # 2. Class weights
    class_weights = get_class_weights(train_gen)

    # 3. Build model
    model = build_model()

    # ────────── PHASE 1: Frozen backbone ──────────
    print(f"\n{'='*60}")
    print(f"[PHASE 1] Training classification head (backbone frozen)")
    print(f"          Epochs: {EPOCHS_PHASE1}")
    print(f"{'='*60}")

    model.fit(
        train_gen,
        epochs=EPOCHS_PHASE1,
        validation_data=val_gen,
        class_weight=class_weights,
        callbacks=[
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
        ],
    )

    # ────────── PHASE 2: Unfreeze last 8 layers (top 2 conv blocks of VGG16) ──────────
    print(f"\n{'='*60}")
    print(f"[PHASE 2] Fine-tuning top 2 conv blocks (last 8 layers)")
    print(f"          Epochs: {EPOCHS_PHASE2}")
    print(f"{'='*60}")

    unfreeze_layers(model, 8)
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE / 10),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
        metrics=["accuracy"],
    )

    model.fit(
        train_gen,
        epochs=EPOCHS_PHASE2,
        validation_data=val_gen,
        class_weight=class_weights,
        callbacks=[
            EarlyStopping(
                monitor="val_loss", patience=5,
                restore_best_weights=True, verbose=1
            ),
            ReduceLROnPlateau(
                monitor="val_loss", factor=0.5,
                patience=2, min_lr=1e-8, verbose=1
            ),
            ModelCheckpoint(
                MODEL_PATH, monitor="val_accuracy",
                save_best_only=True, verbose=1
            ),
        ],
    )

    # ────────── PHASE 3: Deep fine-tune (last 14 layers = top 4 conv blocks) ──────────
    print(f"\n{'='*60}")
    print(f"[PHASE 3] Deep fine-tuning last 14 layers")
    print(f"          Epochs: {EPOCHS_PHASE3}")
    print(f"{'='*60}")

    unfreeze_layers(model, 14)
    model.compile(
        optimizer=Adam(learning_rate=LEARNING_RATE / 50),
        loss=tf.keras.losses.CategoricalCrossentropy(label_smoothing=0.1),
        metrics=["accuracy"],
    )

    model.fit(
        train_gen,
        epochs=EPOCHS_PHASE3,
        validation_data=val_gen,
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

    # Save final model
    model.save(MODEL_PATH)
    print(f"\n[OK] Model saved to {MODEL_PATH}")

    # Evaluate
    metrics = evaluate_model(model, val_gen)

    print(f"\n{'='*60}")
    print(f"[DONE] Coccidiosis v2 Training Complete!")
    print(f"       Overall Accuracy: {metrics['accuracy']:.4f}")
    for name, vals in metrics['per_class'].items():
        print(f"       {name}: F1={vals['f1-score']:.4f}, Precision={vals['precision']:.4f}, Recall={vals['recall']:.4f}")
    print(f"\n       Backup of old model: {BACKUP_PATH}")
    print(f"       If the new model is worse, restore: copy {BACKUP_PATH} → {MODEL_PATH}")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
