"""
DNN Model for fire risk prediction using TensorFlow/Keras.
"""
import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import pickle
import json

MODEL_DIR = os.path.join(os.path.dirname(__file__), 'saved_model')
MODEL_PATH = os.path.join(MODEL_DIR, 'fire_risk_model.keras')
SCALER_PATH = os.path.join(MODEL_DIR, 'scaler.pkl')
METADATA_PATH = os.path.join(MODEL_DIR, 'metadata.json')

RISK_LABELS = {0: 'Low', 1: 'Medium', 2: 'High', 3: 'Critical'}


def build_dnn_model(input_shape: int = 4, num_classes: int = 4):
    """Build a Deep Neural Network for fire risk classification."""
    model = keras.Sequential([
        keras.layers.Input(shape=(input_shape,)),

        keras.layers.Dense(128, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),

        keras.layers.Dense(64, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.3),

        keras.layers.Dense(32, activation='relu'),
        keras.layers.BatchNormalization(),
        keras.layers.Dropout(0.2),

        keras.layers.Dense(16, activation='relu'),

        keras.layers.Dense(num_classes, activation='softmax')
    ])

    model.compile(
        optimizer=keras.optimizers.Adam(learning_rate=0.001),
        loss='sparse_categorical_crossentropy',
        metrics=['accuracy']
    )

    return model


def train_model(X: np.ndarray, y: np.ndarray):
    """Train the DNN model and save it."""
    os.makedirs(MODEL_DIR, exist_ok=True)

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Save scaler
    with open(SCALER_PATH, 'wb') as f:
        pickle.dump(scaler, f)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X_scaled, y, test_size=0.2, random_state=42, stratify=y
    )

    # Handle class imbalance with class weights
    from sklearn.utils.class_weight import compute_class_weight
    classes = np.unique(y_train)
    class_weights = compute_class_weight('balanced', classes=classes, y=y_train)
    class_weight_dict = dict(zip(classes.astype(int), class_weights))

    # Build and train model
    model = build_dnn_model(input_shape=X_train.shape[1])

    history = model.fit(
        X_train, y_train,
        validation_data=(X_test, y_test),
        epochs=100,
        batch_size=32,
        class_weight=class_weight_dict,
        callbacks=[
            keras.callbacks.EarlyStopping(
                monitor='val_loss', patience=15, restore_best_weights=True
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss', factor=0.5, patience=5, min_lr=1e-6
            )
        ],
        verbose=1
    )

    # Evaluate
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTest Loss: {loss:.4f}")
    print(f"Test Accuracy: {accuracy:.4f}")

    # Save model
    model.save(MODEL_PATH)

    # Save metadata
    metadata = {
        'accuracy': float(accuracy),
        'loss': float(loss),
        'feature_names': ['temp', 'RH', 'wind', 'rain'],
        'risk_labels': RISK_LABELS,
        'input_shape': X_train.shape[1],
        'num_classes': 4
    }
    with open(METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"Model saved to {MODEL_PATH}")
    return model, scaler, history


def load_model():
    """Load the trained model and scaler."""
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(
            f"Model not found at {MODEL_PATH}. Run training first."
        )

    model = keras.models.load_model(MODEL_PATH)

    with open(SCALER_PATH, 'rb') as f:
        scaler = pickle.load(f)

    return model, scaler


def predict_risk(model, scaler, temp: float, humidity: float, wind: float, rain: float):
    """Predict fire risk from weather parameters."""
    features = np.array([[temp, humidity, wind, rain]])
    features_scaled = scaler.transform(features)

    predictions = model.predict(features_scaled, verbose=0)
    predicted_class = int(np.argmax(predictions[0]))
    confidence = float(predictions[0][predicted_class])

    return {
        'risk_level': predicted_class,
        'risk_label': RISK_LABELS[predicted_class],
        'confidence': round(confidence * 100, 2),
        'probabilities': {
            RISK_LABELS[i]: round(float(predictions[0][i]) * 100, 2)
            for i in range(len(RISK_LABELS))
        }
    }


if __name__ == '__main__':
    from preprocess import preprocess_data

    print("Loading and preprocessing data...")
    df, X, y, feature_cols = preprocess_data()

    print(f"Training DNN model with {len(X)} samples...")
    model, scaler, history = train_model(X, y)

    # Test prediction
    print("\nTest prediction (temp=25, RH=30, wind=4, rain=0):")
    result = predict_risk(model, scaler, 25, 30, 4, 0)
    print(f"  Risk: {result['risk_label']} ({result['confidence']}% confidence)")
    print(f"  Probabilities: {result['probabilities']}")
