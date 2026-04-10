const express = require('express');
const cors = require('cors');

const verifyRoutes = require('./routes/verify');
const transactionRoutes = require('./routes/transaction');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api', verifyRoutes);
app.use('/api', transactionRoutes);

app.get('/', (req, res) => {
  res.send('zkTransact Server is running');
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
