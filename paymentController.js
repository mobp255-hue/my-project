const Transaction = require('../models/Transaction');
const User = require('../models/User');
const crypto = require('crypto');

// Simulated EcoCash payment gateway
class EcoCashGateway {
  constructor() {
    this.baseUrl = process.env.ECOCASH_BASE_URL;
    this.apiKey = process.env.ECOCASH_API_KEY;
    this.secret = process.env.ECOCASH_SECRET;
  }

  async initiateDeposit(amount, phoneNumber, reference) {
    // In a real implementation, this would call the EcoCash API
    // For simulation, we'll generate a fake 

transaction
    
    const paymentId = `ECO${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    return {
      success: true,
      paymentId,
      reference,
      amount,
      phoneNumber,
      status: 'pending',
      message: 'Payment initiated. Please authorize on your phone.'
    };
  }

  async verifyDeposit(paymentId) {
    // Simulate payment verification
    // In reality, this would check with EcoCash API

    
    return {
      success: true,
      paymentId,
      status: 'completed',
      verifiedAt: new Date()
    };
  }

  async initiateWithdrawal(amount, phoneNumber, reference) {
    // Simulate withdrawal initiation
    
    const withdrawalId = `ECOW${Date.now()}${Math.floor(Math.random() * 1000)}`;
    
    return {
      success: true,
      withdrawalId,
      reference,

      amount,
      phoneNumber,
      status: 'processing',
      message: 'Withdrawal request submitted'
    };
  }
}

const ecoCash = new EcoCashGateway();

exports.deposit = async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (amount < 5) {
      return res.status(400).json({
        success: false,

        message: 'Minimum deposit amount is $5'
      });
    }

    if (amount > 1000) {
      return res.status(400).json({
        success: false,
        message: 'Maximum deposit amount is $1000'
      });
    }

    // Generate unique reference
    const reference = `DEP${Date.now()}${userId.toString().slice(-6)}`;

    // Create pending transaction
    const transaction = new Transaction({
      user: userId,
      type: 'deposit',

      amount,
      balanceBefore: req.user.balance,
      balanceAfter: req.user.balance,
      paymentMethod: 'ecocash',
      reference,
      ecocashReference: phoneNumber,
      status: 'pending',
      description: `Deposit via EcoCash to ${phoneNumber}`
    });

    await transaction.save();

    // Initiate payment with EcoCash
    const paymentResult = await ecoCash.initiateDeposit(amount, phoneNumber, reference);

    res.json({
      success: true,
      message: 'Deposit initiated',

      transaction: {
        id: transaction._id,
        reference: transaction.reference,
        amount: transaction.amount,
        status: transaction.status
      },
      payment: paymentResult
    });

  } catch (error) {
    console.error('Deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process deposit'
    });
  }
};

exports.verifyDeposit = async (req, res) => {
  try {
    const { transactionId } = req.params;

    const userId = req.user._id;

    const transaction = await Transaction.findOne({
      _id: transactionId,
      user: userId,
      type: 'deposit',
      status: 'pending'
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify with EcoCash
    const verification = await ecoCash.verifyDeposit(transaction.reference);


    if (verification.success && verification.status === 'completed') {
      // Update transaction
      transaction.status = 'completed';
      transaction.processedAt = new Date();
      transaction.balanceAfter = transaction.balanceBefore + transaction.amount;
      await transaction.save();

      // Update user balance
      const user = await User.findById(userId);
      user.balance += transaction.amount;
      await user.save();

      res.json({
        success: true,
        message: 'Deposit completed successfully',

        transaction: transaction.getPublicProfile(),
        newBalance: user.balance
      });
    } else {
      res.json({
        success: false,
        message: 'Payment not yet completed'
      });
    }

  } catch (error) {
    console.error('Verify deposit error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify deposit'
    });
  }
};

exports.withdraw = async (req, res) => {
  try {
    const { amount, phoneNumber } = req.body;
    const userId = req.user._id;

    // Validate amount
    if (amount < 10) {
      return res.status(400).json({
        success: false,
        message: 'Minimum withdrawal amount is $10'
      });
    }

    if (amount > req.user.balance) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient balance'
      });
    }


    // Generate unique reference
    const reference = `WD${Date.now()}${userId.toString().slice(-6)}`;

    // Create pending transaction
    const transaction = new Transaction({
      user: userId,
      type: 'withdrawal',
      amount: -amount,
      balanceBefore: req.user.balance,
      balanceAfter: req.user.balance - amount,
      paymentMethod: 'ecocash',
      reference,
      ecocashReference: phoneNumber,
      status: 'pending',
      description: `Withdrawal via EcoCash to ${phoneNumber}`
    });

    await transaction.save();

    // Update user balance immediately
    const user = await User.findById(userId);
    user.balance -= amount;
    await user.save();

    // Initiate withdrawal with EcoCash
    const withdrawalResult = await ecoCash.initiateWithdrawal(amount, phoneNumber, reference);

    // Update transaction status
    transaction.status = 'completed';
    transaction.processedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: 'Withdrawal request submitted',

      transaction: transaction.getPublicProfile(),
      newBalance: user.balance,
      withdrawal: withdrawalResult
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process withdrawal'
    });
  }
};

exports.getTransactionHistory = async (req, res) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const userId = req.user._id;


    const query = { user: userId };
    if (type) query.type = type;

    const transactions = await Transaction.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Transaction.countDocuments(query);

    res.json({
      success: true,
      transactions: transactions.map(t => t.getPublicProfile()),
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,

        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Get transaction history error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch transaction history'
    });
  }
};

exports.getBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('balance totalEarnings');
    

    res.json({
      success: true,
      balance: user.balance,
      totalEarnings: user.totalEarnings
    });

  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch balance'
    });
  }
};
