const Game = require('../models/Game');
const User = require('../models/User');
const Match = require('../models/Match');
const Transaction = require('../models/Transaction');

// Store active games in memory for real-time updates
const activeGames = new Map();

const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log(`New socket connection: ${socket.id}`);

    // Join a game room
    socket.on('joinGame', async ({ gameCode, userId }) => {
      try {
        const game = await Game.findOne({ gameCode });

        
        if (!game) {
          socket.emit('error', { message: 'Game not found' });
          return;
        }

        if (game.status !== 'waiting') {
          socket.emit('error', { message: 'Game already started' });
          return;
        }

        if (game.players.length >= game.maxPlayers) {
          socket.emit('error', { message: 'Game is full' });
          return;
        }

        // Check if player is already in the 

game
        const existingPlayer = game.players.find(p => 
          p.userId && p.userId.toString() === userId
        );

        if (existingPlayer) {
          existingPlayer.socketId = socket.id;
        } else {
          // Add new player
          game.players.push({
            userId,
            socketId: socket.id,
            playerNumber: game.players.length + 1,
            ready: false
          });
        }

        await game.save();

        
        // Join socket room
        socket.join(gameCode);
        
        // Update active games map
        activeGames.set(gameCode, {
          game,
          sockets: [...(activeGames.get(gameCode)?.sockets || []), socket.id]
        });

        // Notify all players in the game
        io.to(gameCode).emit('playerJoined', {
          players: game.players,
          game: game
        });

      } catch (error) {
        console.error('Join game error:', error);
        socket.emit('error', { message: 'Failed to join game' });
      }
    });

    // Player ready status
    socket.on('playerReady', async ({ gameCode, userId, ready }) => {
      try {
        const game = await Game.findOne({ gameCode });
        
        if (!game) return;

        const player = game.players.find(p => 
          p.userId && p.userId.toString() === userId
        );

        if (player) {
          player.ready = ready;
          await game.save();


          io.to(gameCode).emit('playerStatus', {
            playerId: userId,
            ready
          });

          // Check if all players are ready
          const allReady = game.players.every(p => p.ready);
          if (allReady && game.players.length === game.maxPlayers) {
            game.status = 'active';
            game.startedAt = new Date();
            await game.save();

            // Initialize game state based on game type
            const initialState = initializeGameState(game.gameType);
            game.boardState = initialState;
            await game.save();


            io.to(gameCode).emit('gameStarted', {
              game,
              initialState
            });
          }
        }
      } catch (error) {
        console.error('Player ready error:', error);
      }
    });

    // Make a move
    socket.on('makeMove', async ({ gameCode, userId, move }) => {
      try {
        const game = await Game.findOne({ gameCode });
        

        if (!game || game.status !== 'active') return;

        const player = game.players.find(p => 
          p.userId && p.userId.toString() === userId
        );

        if (!player) return;

        // Validate move based on game type
        const isValid = validateMove(game.gameType, game.boardState, move, player.playerNumber);
        
        if (!isValid) {
          socket.emit('invalidMove', { message: 'Invalid move' });
          return;
        }


        // Update board state
        const newState = applyMove(game.gameType, game.boardState, move);
        game.boardState = newState;
        
        // Record move
        game.moves.push({
          player: player.playerNumber,
          from: move.from,
          to: move.to,
          piece: move.piece,
          timestamp: new Date()
        });

        await game.save();

        // Broadcast move to all players
        io.to(gameCode).emit('moveMade', {
          player: player.playerNumber,

          move,
          newState
        });

        // Check for game end
        const gameResult = checkGameEnd(game.gameType, newState, game.moves);
        
        if (gameResult) {
          await endGame(game, gameResult);
        }

      } catch (error) {
        console.error('Make move error:', error);
      }
    });

    // Chat message
    socket.on('sendMessage', ({ gameCode, 

userId, message }) => {
      io.to(gameCode).emit('newMessage', {
        userId,
        message,
        timestamp: new Date()
      });
    });

    // Offer draw
    socket.on('offerDraw', ({ gameCode, userId }) => {
      socket.to(gameCode).emit('drawOffered', { userId });
    });

    // Resign
    socket.on('resign', async ({ gameCode, userId }) => {
      try {
        const game = await Game.findOne({ 

gameCode });
        
        if (!game || game.status !== 'active') return;

        const resigningPlayer = game.players.find(p => 
          p.userId && p.userId.toString() === userId
        );

        const winner = game.players.find(p => 
          p.userId && p.userId.toString() !== userId
        );

        game.winner = winner?.userId;
        game.result = winner ? (winner.playerNumber === 1 ? 'player1' : 'player2') : 'draw';
        game.status = 'completed';

        game.completedAt = new Date();

        await game.save();
        await processGameResult(game);

        io.to(gameCode).emit('gameEnded', {
          result: game.result,
          winner: game.winner
        });

      } catch (error) {
        console.error('Resign error:', error);
      }
    });

    // Disconnect
    socket.on('disconnect', async () => {
      console.log(`Socket disconnected: ${socket.id}`);
      
      // Handle player disconnect

      for (const [gameCode, gameData] of activeGames.entries()) {
        const index = gameData.sockets.indexOf(socket.id);
        if (index > -1) {
          gameData.sockets.splice(index, 1);
          
          if (gameData.sockets.length === 0) {
            activeGames.delete(gameCode);
          } else {
            // Notify other players
            io.to(gameCode).emit('playerDisconnected', { socketId: socket.id });
          }
          break;
        }
      }
    });
  });
};


// Helper functions
function initializeGameState(gameType) {
  switch(gameType) {
    case 'checkers':
      return initializeCheckersBoard();
    case 'chess':
      return initializeChessBoard();
    case 'tictactoe':
      return initializeTicTacToeBoard();
    default:
      return {};
  }
}

function validateMove(gameType, boardState, move, playerNumber) {
  // Implement game-specific move validation
  return true; // Simplified for example
}


function applyMove(gameType, boardState, move) {
  // Apply move to board state
  return boardState; // Simplified for example
}

function checkGameEnd(gameType, boardState, moves) {
  // Check if game has ended
  return null; // Simplified for example
}

async function endGame(game, result) {
  game.status = 'completed';
  game.result = result;
  game.completedAt = new Date();
  
  if (result !== 'draw') {
    const winner = game.players.find(p => 

      (result === 'player1' && p.playerNumber === 1) ||
      (result === 'player2' && p.playerNumber === 2)
    );
    game.winner = winner?.userId;
  }
  
  await game.save();
  await processGameResult(game);
}

async function processGameResult(game) {
  if (game.betAmount > 0) {
    await processBettingResult(game);
  }
  
  // Update player stats
  for (const player of game.players) {
    if (player.userId) {

      await updatePlayerStats(player.userId, game.gameType, game.result, player.playerNumber);
    }
  }
}

async function processBettingResult(game) {
  // Process betting payouts
  const match = new Match({
    gameId: game._id,
    gameType: game.gameType,
    players: game.players.map(p => ({
      userId: p.userId,
      playerNumber: p.playerNumber,
      betAmount: game.betAmount
    })),
    betAmount: game.betAmount,
    totalPot: game.betAmount * game.players.length,

    status: 'completed'
  });

  if (game.result === 'draw') {
    // Return bets to players
    for (const player of game.players) {
      if (player.userId) {
        await createTransaction({
          userId: player.userId,
          type: 'refund',
          amount: game.betAmount,
          description: 'Draw - bet refunded'
        });
      }
    }
    match.result = 'draw';
  } else {
    const winner = game.players.find(p => 
      (game.result === 'player1' && p.playerNumber === 1) ||
      (game.result === 'player2' && 

p.playerNumber === 2)
    );

    if (winner?.userId) {
      const commission = game.betAmount * game.players.length * 0.05; // 5% commission
      const winnings = (game.betAmount * game.players.length) - commission;
      
      match.winner = winner.userId;
      match.commission = commission;
      
      // Award winnings to winner
      await createTransaction({
        userId: winner.userId,
        type: 'win',
        amount: winnings,
        description: `Won ${game.gameType} match`
      });


      // Deduct loss from loser
      const loser = game.players.find(p => p.userId.toString() !== winner.userId.toString());
      if (loser?.userId) {
        await createTransaction({
          userId: loser.userId,
          type: 'loss',
          amount: -game.betAmount,
          description: `Lost ${game.gameType} match`
        });
      }
    }
  }

  await match.save();
}

async function 

createTransaction(transactionData) {
  const transaction = new Transaction(transactionData);
  await transaction.save();
  
  // Update user balance
  const user = await User.findById(transactionData.userId);
  if (user) {
    user.balance += transactionData.amount;
    await user.save();
  }
}

async function updatePlayerStats(userId, gameType, result, playerNumber) {
  const user = await User.findById(userId);
  if (!user) return;

  const isWinner = (result === 'player1' && playerNumber === 1) ||

                   (result === 'player2' && playerNumber === 2);

  if (isWinner) {
    user.totalWins += 1;
    user.stats[gameType].wins += 1;
    user.experience += 100;
  } else if (result === 'draw') {
    user.stats[gameType].draws += 1;
    user.experience += 50;
  } else {
    user.totalLosses += 1;
    user.stats[gameType].losses += 1;
    user.experience += 10;
  }

  // Level up based on experience
  const neededExp = user.level * 1000;
  if (user.experience >= neededExp) {
    user.level += 1;
    user.experience -= neededExp;

  }

  await user.save();
}

module.exports = setupSocket;
