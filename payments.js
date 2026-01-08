const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const paymentController = require('../controllers/paymentController');
const { auth } = require('../middleware/auth');

// Deposit funds
router.post('/deposit', auth, [
  check('amount', 'Amount is required').isFloat({ min: 5 }),
  check('phoneNumber', 'Valid phone number is required').isLength({ min: 10 })
], paymentController.deposit);

// Verify deposit
router.get('/verify-deposit/:transactionId', auth, paymentController.verifyDeposit);

// Withdraw funds
router.post('/withdraw', auth, [
  check('amount', 'Amount is required').isFloat({ min: 10 }),
  check('phoneNumber', 'Valid phone number is required').isLength({ min: 10 })
], paymentController.withdraw);

// Get transaction history
router.get('/transactions', auth, paymentController.getTransactionHistory);

// Get current balance
router.get('/balance', auth, paymentController.getBalance);

module.exports = router;
