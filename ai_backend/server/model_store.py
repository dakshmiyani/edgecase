import joblib
import os
import json
from datetime import datetime

MODEL_DIR = "models"
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR)

def save_model(model, feature_names=None, version=None, accuracy=None):
    if version is None:
        version = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Save as binary joblib
    path = os.path.join(MODEL_DIR, f"global_model_{version}.joblib")
    joblib.dump(model, path)
    
    # Save weights as JSON (as requested by user)
    if hasattr(model, "coef_"):
        weights_data = {
            "coef": model.coef_.tolist(),
            "intercept": model.intercept_.tolist(),
            "feature_names": feature_names if feature_names else [],
            "version": version,
            "round_auc": accuracy
        }
        json_path = os.path.join(MODEL_DIR, f"global_weights_{version}.json")
        with open(json_path, "w") as f:
            json.dump(weights_data, f)
        
        # Link latest JSON
        latest_json_path = os.path.join(MODEL_DIR, "global_weights_latest.json")
        with open(latest_json_path, "w") as f:
            json.dump(weights_data, f)

    # Link latest binary
    latest_path = os.path.join(MODEL_DIR, "global_model_latest.joblib")
    joblib.dump(model, latest_path)

    # Save current global accuracy if provided
    if accuracy is not None:
        acc_path = os.path.join(MODEL_DIR, "global_acc_latest.json")
        with open(acc_path, "w") as f:
            json.dump({"accuracy": accuracy, "timestamp": datetime.now().isoformat()}, f)

    return path

def load_latest_model():
    path = os.path.join(MODEL_DIR, "global_model_latest.joblib")
    if os.path.exists(path):
        return joblib.load(path)
    return None
