export const BOARD_WIDTH = 10
export const BOARD_HEIGHT = 20
export const TICK_MS = 800

const PIECES = [
  {
    name: 'I',
    color: '#38bdf8',
    shape: [[1, 1, 1, 1]],
  },
  {
    name: 'O',
    color: '#facc15',
    shape: [
      [1, 1],
      [1, 1],
    ],
  },
  {
    name: 'T',
    color: '#a855f7',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
    ],
  },
  {
    name: 'L',
    color: '#fb923c',
    shape: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
  },
  {
    name: 'J',
    color: '#60a5fa',
    shape: [
      [0, 1],
      [0, 1],
      [1, 1],
    ],
  },
  {
    name: 'S',
    color: '#4ade80',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
  },
  {
    name: 'Z',
    color: '#f87171',
    shape: [
      [1, 1, 0],
      [0, 1, 1],
    ],
  },
]

const SCORE_BY_LINES = {
  1: 100,
  2: 300,
  3: 500,
  4: 800,
}

export function createEmptyBoard() {
  return Array.from({ length: BOARD_HEIGHT }, () => Array(BOARD_WIDTH).fill(null))
}

export function createPiece(template = PIECES[Math.floor(Math.random() * PIECES.length)]) {
  return {
    name: template.name,
    color: template.color,
    shape: template.shape.map((row) => [...row]),
    row: 0,
    col: Math.floor((BOARD_WIDTH - template.shape[0].length) / 2),
  }
}

export function isValidPosition(board, shape, row, col) {
  for (let shapeRow = 0; shapeRow < shape.length; shapeRow += 1) {
    for (let shapeCol = 0; shapeCol < shape[shapeRow].length; shapeCol += 1) {
      if (!shape[shapeRow][shapeCol]) {
        continue
      }

      const boardRow = row + shapeRow
      const boardCol = col + shapeCol

      if (
        boardCol < 0 ||
        boardCol >= BOARD_WIDTH ||
        boardRow < 0 ||
        boardRow >= BOARD_HEIGHT ||
        board[boardRow][boardCol]
      ) {
        return false
      }
    }
  }

  return true
}

export function rotateShape(shape) {
  return shape[0].map((_, columnIndex) =>
    shape.map((row) => row[columnIndex]).reverse(),
  )
}

export function tryRotatePiece(board, piece) {
  const rotatedShape = rotateShape(piece.shape)

  for (const colOffset of [0, -1, 1, -2, 2]) {
    if (isValidPosition(board, rotatedShape, piece.row, piece.col + colOffset)) {
      return {
        ...piece,
        shape: rotatedShape,
        col: piece.col + colOffset,
      }
    }
  }

  return piece
}

export function lockPiece(board, piece) {
  const nextBoard = board.map((row) => [...row])

  piece.shape.forEach((shapeRow, rowIndex) => {
    shapeRow.forEach((value, columnIndex) => {
      if (value) {
        nextBoard[piece.row + rowIndex][piece.col + columnIndex] = piece.color
      }
    })
  })

  return nextBoard
}

export function clearCompletedLines(board) {
  const remainingRows = board.filter((row) => row.some((cell) => cell === null))
  const clearedLines = BOARD_HEIGHT - remainingRows.length

  while (remainingRows.length < BOARD_HEIGHT) {
    remainingRows.unshift(Array(BOARD_WIDTH).fill(null))
  }

  return {
    board: remainingRows,
    clearedLines,
    scoreDelta: SCORE_BY_LINES[clearedLines] ?? 0,
  }
}

export function mergeBoardWithPiece(board, piece) {
  if (!piece) {
    return board
  }

  const nextBoard = board.map((row) => [...row])

  piece.shape.forEach((shapeRow, rowIndex) => {
    shapeRow.forEach((value, columnIndex) => {
      if (value) {
        nextBoard[piece.row + rowIndex][piece.col + columnIndex] = piece.color
      }
    })
  })

  return nextBoard
}

export function getDropRow(board, piece) {
  let nextRow = piece.row

  while (isValidPosition(board, piece.shape, nextRow + 1, piece.col)) {
    nextRow += 1
  }

  return nextRow
}

export function spawnPiece(board) {
  const nextPiece = createPiece()
  return isValidPosition(board, nextPiece.shape, nextPiece.row, nextPiece.col)
    ? nextPiece
    : null
}

export function createInitialGameState() {
  const board = createEmptyBoard()
  const piece = spawnPiece(board)

  return {
    board,
    piece,
    score: 0,
    gameOver: piece === null,
  }
}

export function settlePiece(state, nextPiece = null) {
  const lockedBoard = lockPiece(state.board, state.piece)
  const { board, scoreDelta } = clearCompletedLines(lockedBoard)
  const spawnedPiece = nextPiece ?? spawnPiece(board)

  return {
    board,
    piece: spawnedPiece,
    score: state.score + scoreDelta,
    gameOver: spawnedPiece === null,
  }
}
