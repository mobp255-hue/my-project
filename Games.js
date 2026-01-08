const mongoose = require('mongoose');

const GameSchema = new mongoose.Schema({
  gameType: {
    type: String,
    enum: ['checkers', 'chess', 'tictactoe'],
    required: true
  },
  gameCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  players: [{

    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    socketId: String,
    playerNumber: Number, // 1 or 2
    ready: {
      type: Boolean,
      default: false
    }
  }],
  maxPlayers: {
    type: Number,
    default: 2
  },
  isPrivate: {
    type: Boolean,
    default: true
  },
  betAmount: {

    type: Number,
    default: 0,
    min: 0
  },
  timeControl: {
    type: Number, // in minutes
    default: 10
  },
  status: {
    type: String,
    enum: ['waiting', 'active', 'completed', 'cancelled'],
    default: 'waiting'
  },
  winner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  result: {
    type: String,
    enum: ['player1', 'player2', 'draw', 

'cancelled']
  },
  boardState: {
    type: mongoose.Schema.Types.Mixed
  },
  moves: [{
    player: Number,
    from: String,
    to: String,
    piece: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  startedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for faster queries
GameSchema.index({ gameCode: 1 });
GameSchema.index({ status: 1, createdAt: -1 });
GameSchema.index({ 'players.userId': 1, status: 1 });

module.exports = mongoose.model('Game', GameSchema);
