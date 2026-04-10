import numpy as np

from sklearn.linear_model import LogisticRegression

def fedavg(submissions: list[dict]) -> dict:
    """
    Step 3: Server FedAvg and produce new global weights.
    Weighted average of coef + intercept.
    Weight = n_samples * auc  (rewards both data volume and quality)
    """
    valid = [s for s in submissions if s is not None]
    
    if not valid:
        raise ValueError("No valid submissions this round.")
    
    # Calculate scores for weighting
    scores = [s["n_samples"] * s["auc"] for s in valid]
    total_score = sum(scores)
    
    # Weighted average of coefficients
    new_coef = sum(
        np.array(s["coef"]) * (score / total_score)
        for s, score in zip(valid, scores)
    )
    
    # Weighted average of intercepts
    new_intercept = sum(
        np.array(s["intercept"]) * (score / total_score)
        for s, score in zip(valid, scores)
    )
    
    # Average AUC for the round
    avg_auc = sum(s["auc"] * (score / total_score) for s, score in zip(valid, scores))
    
    return {
        "coef": new_coef.tolist(),
        "intercept": new_intercept.tolist(),
        "round_auc": avg_auc,
        "n_banks": len(valid)
    }

def aggregate_deltas(global_model, delta_submissions):
    """
    global_model: The current global LogisticRegression model.
    delta_submissions: list of {"delta": {"coef": [...], "intercept": [...]}, "n_samples": int, "auc": float}
    Returns: A new LogisticRegression model with aggregated deltas applied.
    """
    if not delta_submissions:
        return global_model

    # Weighted average calculation for deltas
    scores = [s["n_samples"] * s["auc"] for s in delta_submissions]
    total_score = sum(scores)
    
    # Initialize aggregated deltas
    agg_coef_delta = np.zeros_like(global_model.coef_)
    agg_intercept_delta = np.zeros_like(global_model.intercept_)

    for s, score in zip(delta_submissions, scores):
        weight_factor = score / total_score
        agg_coef_delta += np.array(s["delta"]["coef"]) * weight_factor
        agg_intercept_delta += np.array(s["delta"]["intercept"]) * weight_factor

    # Apply aggregated delta to global model
    new_model = LogisticRegression(solver='saga') # Match solver from client
    new_model.coef_ = global_model.coef_ + agg_coef_delta
    new_model.intercept_ = global_model.intercept_ + agg_intercept_delta
    new_model.classes_ = global_model.classes_
    
    return new_model
