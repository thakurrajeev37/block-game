import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ReplayIcon from '@mui/icons-material/Replay';
import {
  createBoard,
  spawnPiece,
  isValidPosition,
  lockPiece,
  clearLines,
  calculateScore,
  hardDrop,
  rotateMatrix,
} from './gameLogic';
import { BOARD_WIDTH, BOARD_HEIGHT, TICK_SPEED } from './constants';

const CELL_SIZE = 30; // px per board cell

/** Render a single cell on the board */
function Cell({ color }) {
  return (
    <Box
      sx={{
        width: CELL_SIZE,
        height: CELL_SIZE,
        boxSizing: 'border-box',
        border: '1px solid rgba(255,255,255,0.08)',
        backgroundColor: color || 'rgba(0,0,0,0.6)',
        borderRadius: '2px',
      }}
    />
  );
}

/** Overlay the active piece onto a board snapshot for rendering */
function getBoardWithPiece(board, piece) {
  if (!piece) return board;
  const { shape, color, x, y } = piece;
  const display = board.map((row) => [...row]);
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const row = y + r;
      const col = x + c;
      if (row >= 0 && row < BOARD_HEIGHT && col >= 0 && col < BOARD_WIDTH) {
        display[row][col] = color;
      }
    }
  }
  return display;
}

/** Compute the ghost piece position (where the piece would land) */
function getGhostPiece(board, piece) {
  if (!piece) return null;
  return hardDrop(board, piece);
}

export default function TetrisGame() {
  const [board, setBoard] = useState(() => createBoard());
  const [piece, setPiece] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);

  // Keep refs so the interval callback can access current state without stale closures
  const boardRef = useRef(board);
  const pieceRef = useRef(piece);
  const gameOverRef = useRef(gameOver);

  useEffect(() => { boardRef.current = board; }, [board]);
  useEffect(() => { pieceRef.current = piece; }, [piece]);
  useEffect(() => { gameOverRef.current = gameOver; }, [gameOver]);

  /** Spawn a new piece; return false if the spawn position is blocked (game over) */
  const trySpawn = useCallback((currentBoard) => {
    const next = spawnPiece();
    if (!isValidPosition(currentBoard, next)) {
      setGameOver(true);
      return false;
    }
    setPiece(next);
    return true;
  }, []);

  /** Lock the current piece, clear lines, update score, spawn next piece */
  const lockAndAdvance = useCallback((currentBoard, currentPiece) => {
    const locked = lockPiece(currentBoard, currentPiece);
    const { newBoard, linesCleared } = clearLines(locked);
    setBoard(newBoard);
    if (linesCleared > 0) {
      setScore((prev) => prev + calculateScore(linesCleared));
    }
    // boardRef must be updated before trySpawn reads it
    boardRef.current = newBoard;
    trySpawn(newBoard);
  }, [trySpawn]);

  /** Automatic falling tick */
  useEffect(() => {
    if (!started || gameOver) return;

    const id = setInterval(() => {
      const currentPiece = pieceRef.current;
      const currentBoard = boardRef.current;
      if (!currentPiece || gameOverRef.current) return;

      const moved = { ...currentPiece, y: currentPiece.y + 1 };
      if (isValidPosition(currentBoard, moved)) {
        setPiece(moved);
      } else {
        lockAndAdvance(currentBoard, currentPiece);
      }
    }, TICK_SPEED);

    return () => clearInterval(id);
  }, [started, gameOver, lockAndAdvance]);

  /** Keyboard controls */
  useEffect(() => {
    if (!started || gameOver) return;

    const handleKey = (e) => {
      const currentPiece = pieceRef.current;
      const currentBoard = boardRef.current;
      if (!currentPiece || gameOverRef.current) return;

      switch (e.key) {
        case 'ArrowLeft': {
          const moved = { ...currentPiece, x: currentPiece.x - 1 };
          if (isValidPosition(currentBoard, moved)) setPiece(moved);
          break;
        }
        case 'ArrowRight': {
          const moved = { ...currentPiece, x: currentPiece.x + 1 };
          if (isValidPosition(currentBoard, moved)) setPiece(moved);
          break;
        }
        case 'ArrowDown': {
          e.preventDefault();
          const moved = { ...currentPiece, y: currentPiece.y + 1 };
          if (isValidPosition(currentBoard, moved)) {
            setPiece(moved);
          } else {
            lockAndAdvance(currentBoard, currentPiece);
          }
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const rotated = rotateMatrix(currentPiece.shape);
          const candidate = { ...currentPiece, shape: rotated };
          // Wall-kick: try shifting left or right if rotation is out of bounds
          for (const offset of [0, -1, 1, -2, 2]) {
            const kicked = { ...candidate, x: candidate.x + offset };
            if (isValidPosition(currentBoard, kicked)) {
              setPiece(kicked);
              break;
            }
          }
          break;
        }
        case ' ': {
          e.preventDefault();
          const dropped = hardDrop(currentBoard, currentPiece);
          lockAndAdvance(currentBoard, dropped);
          break;
        }
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [started, gameOver, lockAndAdvance]);

  /** Start / restart the game */
  const startGame = useCallback(() => {
    const fresh = createBoard();
    setBoard(fresh);
    setScore(0);
    setGameOver(false);
    boardRef.current = fresh;
    setStarted(true);

    const next = spawnPiece();
    // Update both state and ref so the interval tick sees the correct piece
    // immediately on the first tick after (re)start, before React re-renders.
    setPiece(next);
    pieceRef.current = next;
  }, []);

  // Build the display board (locked cells + active piece + ghost)
  const ghost = !gameOver && piece ? getGhostPiece(board, piece) : null;
  const ghostBoard = ghost ? getBoardWithPiece(board, { ...ghost, color: 'rgba(255,255,255,0.15)' }) : board;
  const displayBoard = getBoardWithPiece(ghostBoard, piece);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f0c29, #302b63, #24243e)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems="flex-start">
        {/* Game board */}
        <Paper
          elevation={10}
          sx={{
            p: 1,
            background: '#111',
            border: '2px solid rgba(255,255,255,0.15)',
            borderRadius: 2,
          }}
        >
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `repeat(${BOARD_WIDTH}, ${CELL_SIZE}px)`,
              gap: 0,
            }}
          >
            {displayBoard.map((row, r) =>
              row.map((color, c) => <Cell key={`${r}-${c}`} color={color} />)
            )}
          </Box>
        </Paper>

        {/* Side panel */}
        <Paper
          elevation={10}
          sx={{
            p: 3,
            minWidth: 160,
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 2,
            color: '#fff',
          }}
        >
          <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: '#00BCD4' }}>
            TETRIS
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 2 }} />

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mb: 0.5 }}>
            SCORE
          </Typography>
          <Typography variant="h4" fontWeight="bold" sx={{ mb: 2 }}>
            {score}
          </Typography>

          <Divider sx={{ borderColor: 'rgba(255,255,255,0.15)', mb: 2 }} />

          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, mb: 2 }}>
            ← → Move<br />
            ↑ Rotate<br />
            ↓ Soft drop<br />
            Space Hard drop
          </Typography>

          {gameOver && (
            <Typography variant="h6" color="error" fontWeight="bold" sx={{ mb: 2 }}>
              GAME OVER
            </Typography>
          )}

          {!started ? (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={startGame}
              fullWidth
              sx={{ background: '#00BCD4', '&:hover': { background: '#0097A7' } }}
            >
              Start
            </Button>
          ) : (
            <Button
              variant="outlined"
              startIcon={<ReplayIcon />}
              onClick={startGame}
              fullWidth
              sx={{ borderColor: '#00BCD4', color: '#00BCD4', '&:hover': { borderColor: '#0097A7' } }}
            >
              Restart
            </Button>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}
