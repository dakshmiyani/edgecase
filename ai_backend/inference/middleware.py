from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
import json
import time
from typing import Dict, Any

from bank_client.preprocess import preprocess

app = FastAPI(title="FedGuard Inference Middleware")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

model = None
scaler = None
feature_cols = None

def load_inference_model():
    global model, scaler, feature_cols

    # --- 1. Try to reconstruct model from JSON weights (version-safe) ---
    weights_path = "models/global_weights_latest.json"
    if os.path.exists(weights_path):
        try:
            with open(weights_path, "r") as f:
                data = json.load(f)
            from sklearn.linear_model import LogisticRegression
            model = LogisticRegression(solver="saga")
            model.coef_ = np.array(data["coef"])
            model.intercept_ = np.array(data["intercept"])
            model.classes_ = np.array([0, 1])
        except Exception as e:
            print(f"Failed to load model from JSON weights: {e}")
            model = None

    # --- 2. Fallback to binary joblib if JSON reconstruction failed ---
    if model is None:
        model_path = "models/global_model_latest.joblib"
        if os.path.exists(model_path):
            try:
                model = joblib.load(model_path)
            except Exception as e:
                print(f"Failed to load joblib model: {e}")
                return False

    # --- 3. Load scaler and feature columns ---
    if os.path.exists("models/scaler_global.joblib"):
        scaler = joblib.load("models/scaler_global.joblib")
    if os.path.exists("models/feature_cols.joblib"):
        feature_cols = joblib.load("models/feature_cols.joblib")

    return model is not None

@app.on_event("startup")
async def startup_event():
    load_inference_model()

@app.get("/")
def read_root():
    return {"status": "Inference middleware is online", "model_loaded": model is not None}

@app.get("/health")
def health():
    return {"status": "Inference middleware is healthy", "model_loaded": model is not None}

# Fields that are NOT model features — strip them before preprocessing
NON_FEATURE_FIELDS = {"currency"}

@app.post("/score")
async def score_transaction(txn: Dict[str, Any] = Body(...)):
    global model
    if model is None:
        if not load_inference_model():
            return {"error": "Model not loaded", "action": "fail-open"}

    start_time = time.time()

    # Strip non-feature fields the model was never trained on
    clean_txn = {k: v for k, v in txn.items() if k not in NON_FEATURE_FIELDS}

    # Create a dataframe for the preprocessing step
    df_txn = pd.DataFrame([clean_txn])

    try:
        # Preprocess using the global preprocessors saved during simulation
        X, _, _, _ = preprocess(df_txn, scaler=scaler, feature_cols=feature_cols)

        # Inference (model is now an averaged Logistic Regression)
        fraud_score = float(model.predict_proba(X)[:, 1][0])
        
        # Action logic
        action = "pass"
        if fraud_score > 0.8:
            action = "block"
        elif fraud_score > 0.5:
            action = "flag"

        latency_ms = (time.time() - start_time) * 1000
        
        return {
            "fraud_score": round(fraud_score, 4),
            "action": action,
            "latency_ms": round(latency_ms, 2)
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        return {"error": str(e), "action": "fail-open"}
