// Simple in-memory storage for demonstration purposes
const transactions = [];

exports.makeTransaction = (req, res) => {
  const { userId, amount, toAddress } = req.body;

  if (!userId || !userId.startsWith("zk_")) {
    return res.status(401).json({ status: "error", message: "Unauthorized or invalid identity proof" });
  }

  const txId = "tx_" + Date.now().toString(36);
  
  const tx = {
    txId,
    userId, // Anonymous ID
    amount,
    toAddress,
    timestamp: new Date().toISOString()
  };

  transactions.push(tx);

  res.json({
    status: "success",
    message: "Transaction successful and anonymous",
    transaction: tx
  });
};
