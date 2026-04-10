const express = require('express');
const router = express.Router();
const verifyController = require('../controllers/verifyController');

router.post('/verify-user', verifyController.verifyUser);

module.exports = router;
