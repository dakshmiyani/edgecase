from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
import numpy as np

def train_local_model(X, y, global_weights=None):
    """
    Trains a local Logistic Regression model with SAGA solver for warm starting.
    Step 2: Load global weights, train on local data, ship full weights.
    """
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    
    # Warm-start parameters as requested
    model = LogisticRegression(
        max_iter=50,           # Fewer iters for fine-tuning
        solver='saga',         # Supports warm start properly
        C=0.1,
        warm_start=True
    )
    
    if global_weights:
        # First fit to initialize internals (structure, classes)
        model.fit(X_train, y_train)
        
        # Then inject global weights as starting point
        model.coef_ = np.array(global_weights["coef"]).copy()
        model.intercept_ = np.array(global_weights["intercept"]).copy()
        
        # Second fit fine-tunes from global starting point
        model.fit(X_train, y_train)
    else:
        # Initial round: standard training
        model.fit(X_train, y_train)
    
    return model, X_train, y_train, X_val, y_val
