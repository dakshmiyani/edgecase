from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
import joblib
import os
import io
import json
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

from .model_store import save_model, load_latest_model
from .fedavg import fedavg, aggregate_deltas

app = FastAPI(title="FedGuard API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Simple in-memory storage for current round of model/delta submissions
model_submissions = []
delta_submissions = []

@app.get("/")
def read_root():
    model = load_latest_model()
    return {"status": "FedGuard is online", "model_loaded": model is not None}

@app.post("/upload_weights")
async def upload_weights(
    bank_id: str = Body(...),
    coef: List[List[float]] = Body(...),
    intercept: List[float] = Body(...),
    n_samples: int = Body(...),
    auc: float = Body(...)
):
    model_submissions.append({
        "bank_id": bank_id,
        "coef": coef,
        "intercept": intercept,
        "n_samples": n_samples,
        "auc": auc
    })
    return {"message": f"Weights received from {bank_id}", "round_submissions": len(model_submissions)}

@app.post("/upload_delta")
async def upload_delta(
    bank_id: str = Body(...),
    delta: Dict[str, Any] = Body(...),
    n_samples: int = Body(...),
    auc: float = Body(...)
):
    delta_submissions.append({
        "bank_id": bank_id,
        "delta": delta,
        "n_samples": n_samples,
        "auc": auc
    })
    return {"message": f"Delta received from {bank_id}", "round_submissions": len(delta_submissions)}

@app.post("/upload")
async def upload_model(
    bank_id: str = Form(...),
    n_samples: int = Form(...),
    auc: float = Form(...),
    model_file: UploadFile = File(...)
):
    # Read the uploaded file and load the model
    contents = await model_file.read()
    model = joblib.load(io.BytesIO(contents))
    
    model_submissions.append({
        "bank_id": bank_id,
        "n_samples": n_samples,
        "auc": auc,
        "model": model
    })
    
    return {"message": f"Model received from {bank_id}", "round_submissions": len(model_submissions)}

@app.post("/aggregate")
async def aggregate_models(feature_names: List[str] = Body(None), version: int = Body(2)):
    if not model_submissions and not delta_submissions:
        raise HTTPException(status_code=400, detail="No models or deltas submitted for aggregation")
    
    # Load old accuracy for comparison
    old_acc = None
    old_acc_path = os.path.join("models", "global_acc_latest.json")
    if os.path.exists(old_acc_path):
        try:
            with open(old_acc_path, "r") as f:
                old_acc_data = json.load(f)
                old_acc = old_acc_data.get("accuracy")
        except Exception:
            pass

    if delta_submissions:
        # Load the latest global model as a base for applying deltas
        latest_model = load_latest_model()
        if latest_model is None:
            # Fallback to standard FedAvg if no global model exists yet
            if not model_submissions:
                 raise HTTPException(status_code=400, detail="No base global model exists and no weights submitted")
            aggregated = fedavg(model_submissions)
            coef = aggregated["coef"]
            intercept = aggregated["intercept"]
            round_auc = aggregated["round_auc"]
            n_banks = aggregated["n_banks"]
        else:
            global_model = aggregate_deltas(latest_model, delta_submissions)
            coef = global_model.coef_.tolist()
            intercept = global_model.intercept_.tolist()
            # Calculate average AUC for the round
            round_auc = sum(s["auc"] for s in delta_submissions) / len(delta_submissions)
            n_banks = len(delta_submissions)
    else:
        # Standard full model aggregation
        aggregated = fedavg(model_submissions)
        coef = aggregated["coef"]
        intercept = aggregated["intercept"]
        round_auc = aggregated["round_auc"]
        n_banks = aggregated["n_banks"]
    
    # Save as new versioned JSON
    payload = {
        "coef": coef,
        "intercept": intercept,
        "feature_names": feature_names,
        "version": version,
        "round_auc": round_auc
    }
    
    path = os.path.join("models", f"global_weights_v{version}.json")
    with open(path, "w") as f:
        json.dump(payload, f)
    
    # Also link as latest for inference
    latest_path = os.path.join("models", "global_weights_latest.json")
    with open(latest_path, "w") as f:
        json.dump(payload, f)
        
    # Re-create global model object for inference binary storage
    from sklearn.linear_model import LogisticRegression
    global_model_obj = LogisticRegression(solver='saga')
    global_model_obj.coef_ = np.array(coef)
    global_model_obj.intercept_ = np.array(intercept)
    global_model_obj.classes_ = np.array([0, 1])
    
    # Save the binary too
    save_model(global_model_obj, feature_names=feature_names, version=f"v{version}", accuracy=round_auc)
    
    # Clear current round
    model_submissions.clear()
    delta_submissions.clear()
    
    # Calculate percentage change and print stats
    pct_change = 0
    if old_acc is not None and old_acc != 0:
        pct_change = ((round_auc - old_acc) / old_acc) * 100
    
    logger.info("="*40)
    logger.info(f"AGGREGATION COMPLETE (v{version})")
    logger.info(f"Accuracy before merging: {old_acc if old_acc is not None else 'N/A'}")
    logger.info(f"Accuracy after merging:  {round_auc:.4f}")
    logger.info(f"Percentage change:      {pct_change:+.2f}%")
    logger.info("="*40)
    
    logger.info(f"New global saved → {path}")
    return {
        "message": f"Global weights v{version} created",
        "round_auc": round_auc,
        "pct_change": pct_change,
        "n_banks": n_banks,
        "global_params": {
            "coef": coef,
            "intercept": intercept
        }
    }

@app.get("/model/latest/json")
async def get_latest_model_json():
    # Return the latest JSON weights file
    latest_json_path = os.path.join("models", "global_weights_latest.json")
    if os.path.exists(latest_json_path):
        with open(latest_json_path, "r") as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="No global weights available")

@app.get("/model/latest")
async def get_latest_model():
    model = load_latest_model()
    if model is None:
        raise HTTPException(status_code=404, detail="No global model available")
    
    # We return the model as a binary for the client to load
    temp_path = "/tmp/latest_model.joblib"
    joblib.dump(model, temp_path)
    
    from fastapi.responses import FileResponse
    return FileResponse(temp_path, media_type="application/octet-stream", filename="global_model.joblib")


# ---------------------------------------------------------------------------
# Local training endpoint — trains a LogisticRegression on uploaded CSV
# ---------------------------------------------------------------------------
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, classification_report


async def train_from_csv(file: UploadFile):
    contents = await file.read()
    df = pd.read_csv(io.BytesIO(contents))

    X = df.drop(columns=["Class"])
    y = df["Class"]
    X = pd.get_dummies(X, drop_first=True)

    feature_names = list(X.columns)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    from sklearn.linear_model import LogisticRegression as LR
    model = LR(
        max_iter=200,
        solver='liblinear',
        C=0.1
    )
    model.fit(X_train, y_train)

    y_pred_proba = model.predict_proba(X_test)[:, 1]
    auc = roc_auc_score(y_test, y_pred_proba)
    report = classification_report(y_test, (y_pred_proba > 0.5))

    return {
        "auc": round(float(auc), 4),
        "classification_report": report,
        "delta": {
            "coef": model.coef_.tolist(),
            "intercept": model.intercept_.tolist(),
            "feature_names": feature_names
        },
        "n_samples": len(X_train)
    }


@app.post("/train_local")
async def train_local(file: UploadFile = File(...)):
    result = await train_from_csv(file)
    return result


@app.get("/model/stats")
def get_model_stats():
    """
    Reads current global model metadata directly from local files.
    Returns version, AUC, and feature count.
    """
    try:
        latest_json_path = os.path.join("models", "global_weights_latest.json")
        if not os.path.exists(latest_json_path):
            raise HTTPException(status_code=404, detail="No global model available yet")

        with open(latest_json_path, "r") as f:
            data = json.load(f)

        # Get AUC from the weights file, fallback to global_acc_latest.json
        acc = data.get("round_auc")
        if acc is None:
            acc_path = os.path.join("models", "global_acc_latest.json")
            if os.path.exists(acc_path):
                try:
                    with open(acc_path, "r") as f:
                        acc_data = json.load(f)
                        acc = acc_data.get("accuracy")
                except Exception:
                    pass

        return {
            "version":       data.get("version", "v1"),
            "round_auc":     acc,
            "n_banks":       data.get("n_banks"),
            "feature_count": len(data.get("feature_names", []))
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=503, detail=str(e))

import requests as http_requests

@app.get("/model/weights")
def get_model_weights():
    """
    Returns raw coef + intercept + feature_names from the current global model.
    Called twice: once on page load (before), once after aggregation (after).
    """
    try:
        response = http_requests.get(
            "http://127.0.0.1:8000/model/latest/json", 
            timeout=5
        )
        response.raise_for_status()
        data = response.json()
        return {
            "coef":          data.get("coef"),
            "intercept":     data.get("intercept"),
            "feature_names": data.get("feature_names", []),
            "version":       data.get("version", "unknown")
        }
    except Exception as e:
        raise HTTPException(
            status_code=503, 
            detail=f"Could not reach model server: {str(e)}"
        )
