import pandas as pd
import numpy as np
import os
import asyncio
import joblib
from bank_client.preprocess import preprocess
from bank_client.train_local import train_local_model
from bank_client.quality_gate import passes_gate
from bank_client.upload import upload_weights, get_global_weights
import httpx
from rich.console import Console

console = Console()

async def simulate_banks(round_version=2):
    console.print(f"[bold blue]🚀 Starting FedGuard Federated Update Loop (Round {round_version})[/bold blue]")
    
    # 1. Load the dataset
    dataset_path = "data/final_dataset_5k.csv"
    df = pd.read_csv(dataset_path)
    
    # 2. Get global weights from previous round
    global_w = await get_global_weights()
    if not global_w:
        console.print("[bold red]Error: No global weights found. Please run initial training first.[/bold red]")
        return
    
    feature_names = global_w["feature_names"]
    console.print(f"[bold cyan]📥 Global weights v{global_w.get('version', 'unknown')} loaded. Features: {len(feature_names)}[/bold cyan]")

    # 3. Split into 3 banks with different slices (Step 4)
    bank_configs = [
        ("bank_a", df.iloc[:1500]),
        ("bank_b", df.iloc[1500:3200]),
        ("bank_c", df.iloc[3200:])
    ]

    for bank_id, bank_df in bank_configs:
        console.print(f"\n[bold green]🏦 {bank_id} Processing...[/bold green]")
        
        # Load & preprocess local data (Step 2)
        X_raw = bank_df.drop(columns=["Class"])
        y = bank_df["Class"]
        X = pd.get_dummies(X_raw, drop_first=True)
        
        # CRITICAL: align columns to global feature set (Step 2)
        X = X.reindex(columns=feature_names, fill_value=0)
        
        # Train local model with warm-start from global (Step 2)
        model, X_train, y_train, X_val, y_val = train_local_model(X, y, global_weights=global_w)
        
        # Quality Gate (Step 2)
        val_auc = roc_auc_score(y_val, model.predict_proba(X_val)[:, 1])
        
        if val_auc < 0.72:
            console.print(f"❌ [{bank_id}] Quality gate FAILED (AUC: {val_auc:.3f}). Skipping.")
        else:
            console.print(f"✅ [{bank_id}] Quality gate PASSED (AUC: {val_auc:.3f})")
            # Ship weights + metadata (Step 2)
            await upload_weights(bank_id, model, len(X_train), val_auc)

    # 4. Trigger aggregation on server (Step 3)
    console.print("\n[bold magenta]🔄 Triggering Federated Aggregation...[/bold magenta]")
    async with httpx.AsyncClient() as client:
        try:
            # Send feature_names and target version
            payload = {"feature_names": feature_names, "version": round_version}
            response = await client.post("http://localhost:8000/aggregate", json=payload)
            if response.status_code == 200:
                res = response.json()
                console.print(f"[bold cyan]✨ Round {round_version} Complete! New Global AUC: {res['round_auc']:.4f}[/bold cyan]")
            else:
                console.print(f"[bold red]Aggregation failed: {response.text}[/bold red]")
        except Exception as e:
            console.print(f"[bold red]Error connecting to server: {e}[/bold red]")

if __name__ == "__main__":
    asyncio.run(simulate_banks())
