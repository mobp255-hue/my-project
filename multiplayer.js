const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const multiplayerController = require('../controllers/multiplayerController');
const { auth } = require('../middleware/auth');

// Create a new multiplayer game
router.post('/create', auth, [
  check('gameType', 'Game type is required').isIn(['checkers', 'chess', 'tictactoe']),
  check('betAmount', 'Bet amount must be a number').optional().isFloat({ min: 0 }),
  check('timeControl', 'Time control must be a number').optional().isInt({ min: 1 })
], multiplayerController.createGame);

// Join a game by code

router.post('/join', auth, [
  check('gameCode', 'Game code is required').isLength({ min: 6 })
], multiplayerController.joinGame);

// Get public games
router.get('/public', auth, multiplayerController.getPublicGames);

// Get my active games
router.get('/my-games', auth, multiplayerController.getMyGames);

// Get game details
router.get('/:gameId', auth, multiplayerController.getGameDetails);

// Cancel a game
router.post('/:gameId/cancel', auth, multiplayerController.cancelGame);

module.exports = router;
