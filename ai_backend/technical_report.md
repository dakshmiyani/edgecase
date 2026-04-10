# FedGuard Technical Report

## **Project Overview**
FedGuard is a **Federated Fraud Detection System** designed for financial institutions. It enables multiple banks to collaboratively train a global fraud detection model without ever sharing raw transaction data. Instead, banks train local models on their private data and share only the model weights (coefficients and intercepts) with a central server for aggregation.

---

## **Core Architecture**

The system is divided into three primary components:

1.  **Bank Client (`bank_client/`)**: Handles local data preprocessing, model training with warm-starting, and weight synchronization.
2.  **Central Server (`server/`)**: Manages the collection of local weights, performs Federated Averaging (FedAvg), and versions the global model.
3.  **Inference Middleware (`inference/`)**: A high-performance API that serves the global model for real-time transaction scoring.

---

## **Model & Data**

-   **Model**: Logistic Regression using the `saga` solver. This solver was chosen specifically for its robust support for `warm_start`, allowing models to be fine-tuned from a global starting point.
-   **Dataset**: `final_dataset_5k.csv` (High-dimensional tabular data with ~30 features, including categorical variables handled via one-hot encoding).
-   **Features**: Includes transaction amount, device type, merchant category, velocity metrics, and risk scores.

---

## **Federated Learning Loop**

FedGuard implements a refined update loop to maximize accuracy:

1.  **Warm-Start**: Banks fetch the latest global weights (`coef_` and `intercept_`) and use them to initialize their local models.
2.  **Double-Fit Strategy**: Local models are first fitted to initialize internal structures, then injected with global weights, and finally fine-tuned on local data for 50 iterations.
3.  **Feature Alignment**: Clients use a global feature set to ensure that even if a bank hasn't seen a specific category (e.g., a new merchant type), the feature vectors remain consistent across the federation.
4.  **Weighted Aggregation (FedAvg)**: The server aggregates local weights using a custom formula:  
    `Weight = n_samples * AUC`  
    This rewards banks that contribute both high-volume and high-quality data.

---

## **API Documentation**

### **1. Central Server API (Port 8000)**

| Endpoint | Method | Input | Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/upload_weights` | `POST` | `bank_id`, `coef`, `intercept`, `n_samples`, `auc` | Success Message | Receives local weights from a bank. |
| `/aggregate` | `POST` | `feature_names`, `version` | `round_auc`, `n_banks` | Triggers the FedAvg process and saves new version. |
| `/model/latest/json` | `GET` | None | `coef`, `intercept`, `feature_names` | Fetches the latest global weights in JSON format. |
| `/model/latest` | `GET` | None | Binary (`.joblib`) | Downloads the latest global model as a binary file. |

### **2. Inference Middleware API (Port 8001)**

| Endpoint | Method | Input | Output | Description |
| :--- | :--- | :--- | :--- | :--- |
| `/score` | `POST` | Transaction JSON (amount, category, etc.) | `fraud_score`, `action`, `latency_ms` | Scores a transaction in real-time (<100ms). |
| `/health` | `GET` | None | `status`, `model_loaded` | Checks if the inference service is healthy and model is ready. |

---

## **Simulation & Verification**

-   **`simulate_banks.py`**: A full end-to-end simulation that splits the dataset into 3 "banks," performs local training with warm-starting, uploads results, and triggers a server-side aggregation.
-   **`demo_transaction.py`**: A demo script that fires a mix of fraud and clean transactions at the inference middleware to verify the global model's real-time performance.

---

## **Security & Privacy**
By design, the central server never receives raw transaction records. Only aggregated statistical summaries (weights) are transmitted, providing a strong privacy layer between participating institutions.
