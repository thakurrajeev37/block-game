import { BOARD_WIDTH, BOARD_HEIGHT, TETROMINOES, TETROMINO_KEYS } from './constants';

/** Create an empty board: 2D array of null cells */
export function createBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null));
}

/** Pick a random tetromino and place it at the top-center of the board */
export function spawnPiece() {
  const key = TETROMINO_KEYS[Math.floor(Math.random() * TETROMINO_KEYS.length)];
  const { shape, color } = TETROMINOES[key];
  const x = Math.floor((BOARD_WIDTH - shape[0].length) / 2);
  return { shape, color, x, y: 0 };
}

/**
 * Rotate a 2D matrix 90° clockwise.
 * Used for the Up Arrow rotation control.
 */
export function rotateMatrix(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const rotated = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      rotated[c][rows - 1 - r] = matrix[r][c];
    }
  }
  return rotated;
}

/** Check whether placing `piece` at its current (x, y) is valid on `board` */
export function isValidPosition(board, piece) {
  const { shape, x, y } = piece;
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue; // empty cell in piece matrix
      const boardRow = y + r;
      const boardCol = x + c;
      if (
        boardRow >= BOARD_HEIGHT || // below the floor
        boardCol < 0 ||             // off left wall
        boardCol >= BOARD_WIDTH ||  // off right wall
        (boardRow >= 0 && board[boardRow][boardCol]) // overlaps locked cell
      ) {
        return false;
      }
    }
  }
  return true;
}

/** Lock the current piece onto the board (returns a new board) */
export function lockPiece(board, piece) {
  const { shape, color, x, y } = piece;
  const newBoard = board.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const boardRow = y + r;
      const boardCol = x + c;
      if (boardRow >= 0) {
        newBoard[boardRow][boardCol] = color;
      }
    }
  }
  return newBoard;
}

/**
 * Remove completed rows and return the updated board plus how many lines were cleared.
 * Cleared lines are replaced by new empty rows at the top.
 */
export function clearLines(board) {
  const remaining = board.filter((row) => row.some((cell) => !cell));
  const cleared = BOARD_HEIGHT - remaining.length;
  const newRows = Array.from({ length: cleared }, () => Array(BOARD_WIDTH).fill(null));
  return { newBoard: [...newRows, ...remaining], linesCleared: cleared };
}

/**
 * Calculate score for clearing lines.
 * Based on the classic Nintendo Tetris scoring for level 1:
 *   1 line = 100, 2 lines = 300, 3 lines = 500, 4 lines (Tetris) = 800.
 */
export function calculateScore(linesCleared) {
  const points = [0, 100, 300, 500, 800];
  return points[Math.min(linesCleared, 4)];
}

/**
 * Hard-drop: move piece down as far as possible.
 */
export function hardDrop(board, piece) {
  let dropped = { ...piece };
  while (isValidPosition(board, { ...dropped, y: dropped.y + 1 })) {
    dropped = { ...dropped, y: dropped.y + 1 };
  }
  return dropped;
}
