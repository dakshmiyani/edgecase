# FedGuard

Federated Fraud Detection for Banks.

## Architecture
- `bank_client/`: Local model training and weight upload.
- `server/`: Federated aggregation (FedAvg) and model management.
- `inference/`: Real-time transaction scoring middleware.
- `demo/`: Simulation scripts.

## Run Demo
1. Start FedGuard Server: `uvicorn server.app:app --reload --port 8000`
2. Start Inference Middleware: `uvicorn inference.middleware:app --reload --port 8001`
3. Simulate Banks (train & aggregate): `python -m demo.simulate_banks`
4. Run Transaction Demo: `python -m demo.demo_transaction`
