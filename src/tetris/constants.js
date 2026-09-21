// Board dimensions
export const BOARD_WIDTH = 10;
export const BOARD_HEIGHT = 20;

// Tick speed in milliseconds (beginner-friendly)
export const TICK_SPEED = 800;

// Tetromino shapes and colors
export const TETROMINOES = {
  I: {
    shape: [[1, 1, 1, 1]],
    color: '#00BCD4', // cyan
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#FFEB3B', // yellow
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
    color: '#9C27B0', // purple
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '#4CAF50', // green
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '#F44336', // red
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
    ],
    color: '#2196F3', // blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
    ],
    color: '#FF9800', // orange
  },
};

export const TETROMINO_KEYS = Object.keys(TETROMINOES);
