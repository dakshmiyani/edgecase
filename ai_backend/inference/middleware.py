from fastapi import FastAPI, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import joblib
import pandas as pd
import numpy as np
import os
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
    # Look for the latest global model in the shared models directory
    model_path = "models/global_model_latest.joblib"
    if os.path.exists(model_path):
        model = joblib.load(model_path)
        if os.path.exists("models/scaler_global.joblib"):
            scaler = joblib.load("models/scaler_global.joblib")
        if os.path.exists("models/feature_cols.joblib"):
            feature_cols = joblib.load("models/feature_cols.joblib")
        return True
    return False

@app.on_event("startup")
async def startup_event():
    load_inference_model()

@app.get("/")
def read_root():
    return {"status": "Inference middleware is online", "model_loaded": model is not None}

@app.get("/health")
def health():
    return {"status": "Inference middleware is healthy", "model_loaded": model is not None}

@app.post("/score")
async def score_transaction(txn: Dict[str, Any]):
    if model is None:
        if not load_inference_model():
            return {"error": "Model not loaded", "action": "fail-open"}

    start_time = time.time()
    
    # Create a dataframe for the preprocessing step
    df_txn = pd.DataFrame([txn])

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
        print(f"Inference error: {e}")
        return {"error": str(e), "action": "fail-open"}
