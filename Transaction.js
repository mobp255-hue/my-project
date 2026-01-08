const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['deposit', 'withdrawal', 'win', 'loss', 'refund', 'bonus'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,

    required: true
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['ecocash', 'credit_card', 'bank_transfer', 'system'],
    default: 'ecocash'
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  ecocashReference: String,
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 

'cancelled'],
    default: 'pending'
  },
  description: String,
  metadata: {
    type: mongoose.Schema.Types.Mixed
  },
  processedAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Indexes for faster queries
TransactionSchema.index({ user: 1, createdAt: -1 });
TransactionSchema.index({ reference: 1 });
TransactionSchema.index({ status: 1 });


module.exports = mongoose.model('Transaction', TransactionSchema);
