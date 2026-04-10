import httpx
import asyncio
import pandas as pd
import os
from rich.console import Console
from rich.table import Table

console = Console()

async def demo_transaction():
    console.print("[bold blue]🛡️ FedGuard Logistic Regression Inference Demo Starting...[/bold blue]")
    
    # 1. Load sample transactions from the new dataset
    dataset_path = "data/final_dataset_5k.csv"
    if not os.path.exists(dataset_path):
        console.print(f"[bold red]Error: {dataset_path} not found.[/bold red]")
        return
    
    df = pd.read_csv(dataset_path)
    # Pick a few fraud and non-fraud examples
    fraud_samples = df[df["Class"] == 1].head(3)
    clean_samples = df[df["Class"] == 0].head(3)
    test_df = pd.concat([fraud_samples, clean_samples]).sample(frac=1)
    
    # Convert to list of dicts
    test_txns = test_df.drop(columns=["Class"]).to_dict('records')

    # Create results table
    table = Table(title="FedGuard Real-time Fraud Detection (Logistic Regression)")
    table.add_column("Txn ID", justify="right", style="cyan", no_wrap=True)
    table.add_column("Amount", style="magenta")
    table.add_column("Type", style="green")
    table.add_column("Score", style="yellow")
    table.add_column("Action", style="bold")
    table.add_column("Latency", style="white")

    async with httpx.AsyncClient() as client:
        for i, txn in enumerate(test_txns):
            try:
                response = await client.post("http://localhost:8001/score", json=txn)
                if response.status_code == 200:
                    res = response.json()
                    score = res.get("fraud_score", 0.0)
                    action = res.get("action", "N/A")
                    latency = f"{res.get('latency_ms', 0)}ms"
                    
                    # Color action
                    action_styled = action
                    if action == "block":
                        action_styled = "[bold red]🔴 BLOCKED[/bold red]"
                    elif action == "flag":
                        action_styled = "[bold yellow]🟡 FLAG[/bold yellow]"
                    elif action == "pass":
                        action_styled = "[bold green]🟢 PASS[/bold green]"
                    
                    table.add_row(
                        str(i+1), 
                        f"{txn.get('amount', 0):.2f}", 
                        str(txn.get('transaction_type', 'N/A')), 
                        f"{score:.4f}", 
                        action_styled, 
                        latency
                    )
                else:
                    console.print(f"[red]Error for txn {i+1}: {response.text}[/red]")
            except Exception as e:
                console.print(f"[red]Could not connect to inference service: {e}[/red]")
    
    console.print(table)
    console.print("\n[bold cyan]Success![/bold cyan] Logistic Regression Federated Model in action.")

if __name__ == "__main__":
    asyncio.run(demo_transaction())
