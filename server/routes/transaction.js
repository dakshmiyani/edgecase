const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');

router.post('/transaction', transactionController.makeTransaction);

module.exports = router;
