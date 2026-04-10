import numpy as np

class FederatedXGBoost:
    """
    A simple wrapper to average predictions from multiple XGBoost models.
    """
    def __init__(self, models, weights=None):
        self.models = models
        self.weights = weights if weights else [1.0/len(models)] * len(models)

    def predict_proba(self, X):
        # Weighted average of predict_proba from all models
        probs = np.zeros((X.shape[0], 2))
        for model, weight in zip(self.models, self.weights):
            # Ensure model is ready for prediction
            probs += model.predict_proba(X) * weight
        return probs

    def predict(self, X):
        probs = self.predict_proba(X)
        return np.argmax(probs, axis=1)
