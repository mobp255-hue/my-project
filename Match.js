const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  gameId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Game',
    required: true
  },
  gameType: {
    type: String,
    enum: ['checkers', 'chess', 'tictactoe'],
    required: true
  },
  players: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    playerNumber: Number,
    betAmount: Number,
    result: String, // 'win', 'loss', 'draw'
    earnings: Number
  }],
  betAmount: {
    type: Number,
    required: true
  },
  totalPot: {
    type: Number,
    required: true
  },
  commission: {
    type: Number,
    default: 0
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'pending'
  },
  duration: {
    type: Number // in seconds
  },
  moveCount: {
    type: Number,
    default: 0
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  }
});

// Indexes for performance
MatchSchema.index({ 'players.userId': 1, status: 1 });
MatchSchema.index({ gameType: 1, completedAt: -1 });

module.exports = mongoose.model('Match', MatchSchema);
