from sklearn.metrics import roc_auc_score

def passes_gate(model, X_val, y_val, X_train, y_train) -> bool:
    """
    Checks for performance and overfitting.
    """
    try:
        val_auc = roc_auc_score(y_val, model.predict_proba(X_val)[:, 1])
        train_auc = roc_auc_score(y_train, model.predict_proba(X_train)[:, 1])
        
        print(f"Validation AUC: {val_auc:.4f}, Train AUC: {train_auc:.4f}")
        
        # Criteria from prompt: val_auc > 0.72 and (train_auc - val_auc) < 0.08
        # Since this is a demo, let's relax slightly if needed, but we'll stick with these.
        is_passed = val_auc > 0.72 and (train_auc - val_auc) < 0.08
        return is_passed, val_auc
    except Exception as e:
        print(f"Error in quality gate: {e}")
        return False, 0.0
