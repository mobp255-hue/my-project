const mongoose = require('mongoose');

const PuzzleSchema = new mongoose.Schema({
  gameType: {
    type: String,
    enum: ['checkers', 'chess', 'tictactoe'],
    required: true
  },
  difficulty: {
    type: Number,
    min: 1,
    max: 10,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: String,
  initialPosition: {

    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  solution: {
    type: Array,
    required: true
  },
  hints: [{
    text: String,
    move: String
  }],
  rating: {
    type: Number,
    default: 1500
  },
  attempts: {
    type: Number,
    default: 0
  },
  successes: {
    type: Number,

    default: 0
  },
  tags: [String],
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for puzzle selection
PuzzleSchema.index({ gameType: 1, difficulty: 1, rating: 1 });

module.exports = mongoose.model('Puzzle', PuzzleSchema);