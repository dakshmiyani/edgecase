import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
import joblib
import os

# High-cardinality columns to drop for the demo to keep feature space manageable
COLS_TO_DROP = ["user_id", "merchant_id", "ip_address"]

def preprocess(df, scaler=None, feature_cols=None):
    """
    df: Pandas DataFrame with the raw transaction data.
    Returns: X (features), y (target), scaler, feature_cols.
    """
    # 1. Handle Class if present
    if "Class" in df.columns:
        y = df["Class"].values
        X_raw = df.drop(columns=["Class"])
    else:
        y = None
        X_raw = df.copy()

    # 2. Drop high-cardinality columns
    X_raw = X_raw.drop(columns=[c for c in COLS_TO_DROP if c in X_raw.columns])

    # 3. One-hot encoding (matching user logic: drop_first=True)
    X_encoded = pd.get_dummies(X_raw, drop_first=True)

    # 4. Feature consistency (crucial for federated learning)
    if feature_cols is not None:
        # Reindex to match global feature set (add missing columns as 0, drop extra)
        X_encoded = X_encoded.reindex(columns=feature_cols, fill_value=0)
    else:
        # First time seeing this, capture feature columns
        feature_cols = X_encoded.columns.tolist()

    # 5. Scaling
    if scaler is None:
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X_encoded)
    else:
        X_scaled = scaler.transform(X_encoded)
    
    # XGBoost handles numpy arrays fine
    return X_scaled, y, scaler, feature_cols

def save_preprocessors(scaler, encoder, bank_id):
    joblib.dump(scaler, f"bank_client/scaler_{bank_id}.joblib")
    joblib.dump(encoder, f"bank_client/encoder_{bank_id}.joblib")

def load_preprocessors(bank_id):
    scaler = joblib.load(f"bank_client/scaler_{bank_id}.joblib")
    encoder = joblib.load(f"bank_client/encoder_{bank_id}.joblib")
    return scaler, encoder
