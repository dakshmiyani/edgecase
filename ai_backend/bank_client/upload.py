import httpx
import io
import joblib

async def get_global_weights(server_url: str = "http://localhost:8000"):
    """
    Fetches the latest global model weights from the server.
    """
    async with httpx.AsyncClient() as client:
        try:
            # We need a new endpoint on the server to return JSON weights easily
            response = await client.get(f"{server_url}/model/latest/json")
            if response.status_code == 200:
                return response.json()
        except Exception as e:
            print(f"Error fetching global weights: {e}")
    return None

async def upload_weights(bank_id: str, model, n_samples: int, auc: float, server_url: str = "http://localhost:8000"):
    """
    Step 2: Ship weights + metadata.
    Serializes and uploads the model weights to the FedGuard server.
    """
    payload = {
        "bank_id": bank_id,
        "coef": model.coef_.tolist(),
        "intercept": model.intercept_.tolist(),
        "n_samples": n_samples,
        "auc": auc
    }
    
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{server_url}/upload_weights", json=payload)
        if response.status_code == 200:
            print(f"Successfully uploaded weights for bank: {bank_id}")
        else:
            print(f"Failed to upload weights for bank: {bank_id}. Error: {response.text}")
        return response
