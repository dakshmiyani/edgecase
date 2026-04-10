from fastapi import FastAPI, HTTPException, Body, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import numpy as np
import joblib
import os
import io
import json

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
    save_model(global_model_obj, feature_names=feature_names, version=f"v{version}")
    
    # Clear current round
    model_submissions.clear()
    delta_submissions.clear()
    
    print(f"New global saved → {path} | AUC: {round_auc:.4f}")
    return {
        "message": f"Global weights v{version} created",
        "round_auc": round_auc,
        "n_banks": n_banks
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
