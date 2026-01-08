// Checkers game logic
function initializeCheckersBoard() {
  const board = Array(8).fill().map(() => Array(8).fill(null));
  
  // Set up initial checkers positions
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row + col) % 2 !== 0) {
        if (row < 3) {
          board[row][col] = { player: 2, isKing: false }; // Black pieces
        } else if (row > 4) {
          board[row][col] = { player: 1, isKing: false }; // Red pieces
        }
      }
    }
  }
  
  return board;

}

function validateCheckersMove(board, from, to, player) {
  const { row: fromRow, col: fromCol } = from;
  const { row: toRow, col: toCol } = to;
  
  // Check if positions are valid
  if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
      toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
    return false;
  }
  
  const piece = board[fromRow][fromCol];
  if (!piece || piece.player !== player) {
    return false;
  }
  

  // Check if destination is empty
  if (board[toRow][toCol] !== null) {
    return false;
  }
  
  // Calculate move direction
  const rowDiff = toRow - fromRow;
  const colDiff = Math.abs(toCol - fromCol);
  
  // Check if move is diagonal
  if (Math.abs(rowDiff) !== colDiff) {
    return false;
  }
  
  // Regular pieces can only move forward (down for player 1, up for player 2)
  if (!piece.isKing) {
    if ((player === 1 && rowDiff <= 0) || (player === 2 && rowDiff >= 0)) {
      return false;
    }

  }
  
  // Check move distance
  if (Math.abs(rowDiff) === 1) {
    return true; // Regular move
  } else if (Math.abs(rowDiff) === 2) {
    // Jump/capture move
    const jumpedRow = fromRow + (rowDiff / 2);
    const jumpedCol = fromCol + ((toCol - fromCol) / 2);
    const jumpedPiece = board[jumpedRow][jumpedCol];
    
    if (jumpedPiece && jumpedPiece.player !== player) {
      return true; // Valid capture
    }
  }
  
  return false;

}

// Chess game logic (simplified)
function initializeChessBoard() {
  const board = Array(8).fill().map(() => Array(8).fill(null));
  
  // Set up initial chess positions
  const pieceOrder = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  
  for (let col = 0; col < 8; col++) {
    // Player 2 (black) pieces
    board[0][col] = { player: 2, type: pieceOrder[col] };
    board[1][col] = { player: 2, type: 'pawn' };
    
    // Player 1 (white) pieces
    board[6][col] = { player: 1, type: 'pawn' };
    board[7][col] = { player: 1, type: 

pieceOrder[col] };
  }
  
  return board;
}

// Tic Tac Toe game logic
function initializeTicTacToeBoard() {
  return Array(3).fill().map(() => Array(3).fill(null));
}

function checkTicTacToeWin(board) {
  // Check rows
  for (let row = 0; row < 3; row++) {
    if (board[row][0] && board[row][0] === board[row][1] && board[row][1] === board[row][2]) {
      return board[row][0];
    }
  }

  
  // Check columns
  for (let col = 0; col < 3; col++) {
    if (board[0][col] && board[0][col] === board[1][col] && board[1][col] === board[2][col]) {
      return board[0][col];
    }
  }
  
  // Check diagonals
  if (board[0][0] && board[0][0] === board[1][1] && board[1][1] === board[2][2]) {
    return board[0][0];
  }
  
  if (board[0][2] && board[0][2] === board[1][1] && board[1][1] === board[2][0]) {
    return board[0][2];
  }
  

  // Check for draw
  if (board.flat().every(cell => cell !== null)) {
    return 'draw';
  }
  
  return null; // Game continues
}

module.exports = {
  initializeCheckersBoard,
  validateCheckersMove,
  initializeChessBoard,
  initializeTicTacToeBoard,
  checkTicTacToeWin
};
