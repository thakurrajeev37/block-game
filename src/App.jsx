import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Box,
  Button,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from '@mui/material'
import {
  BOARD_WIDTH,
  TICK_MS,
  createInitialGameState,
  getDropRow,
  isValidPosition,
  mergeBoardWithPiece,
  settlePiece,
  tryRotatePiece,
} from './game.js'

const CELL_SIZE = {
  xs: 22,
  sm: 26,
  md: 30,
}

const controls = [
  ['←', 'Move left'],
  ['→', 'Move right'],
  ['↓', 'Soft drop'],
  ['↑', 'Rotate'],
  ['Space', 'Hard drop'],
]

function App() {
  const [game, setGame] = useState(createInitialGameState)

  const resetGame = useCallback(() => {
    setGame(createInitialGameState())
  }, [])

  const settleCurrentPiece = useCallback((state, row = state.piece.row) => {
    return settlePiece({
      ...state,
      piece: {
        ...state.piece,
        row,
      },
    })
  }, [])

  const movePiece = useCallback((columnOffset) => {
    setGame((current) => {
      if (current.gameOver || !current.piece) {
        return current
      }

      const nextCol = current.piece.col + columnOffset
      return isValidPosition(current.board, current.piece.shape, current.piece.row, nextCol)
        ? {
            ...current,
            piece: {
              ...current.piece,
              col: nextCol,
            },
          }
        : current
    })
  }, [])

  const rotatePiece = useCallback(() => {
    setGame((current) => {
      if (current.gameOver || !current.piece) {
        return current
      }

      return {
        ...current,
        piece: tryRotatePiece(current.board, current.piece),
      }
    })
  }, [])

  const stepDown = useCallback(() => {
    setGame((current) => {
      if (current.gameOver || !current.piece) {
        return current
      }

      const nextRow = current.piece.row + 1
      if (isValidPosition(current.board, current.piece.shape, nextRow, current.piece.col)) {
        return {
          ...current,
          piece: {
            ...current.piece,
            row: nextRow,
          },
        }
      }

      return settleCurrentPiece(current)
    })
  }, [settleCurrentPiece])

  const hardDrop = useCallback(() => {
    setGame((current) => {
      if (current.gameOver || !current.piece) {
        return current
      }

      return settleCurrentPiece(current, getDropRow(current.board, current.piece))
    })
  }, [settleCurrentPiece])

  useEffect(() => {
    if (game.gameOver) {
      return undefined
    }

    const timer = window.setInterval(stepDown, TICK_MS)
    return () => window.clearInterval(timer)
  }, [game.gameOver, stepDown])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        movePiece(-1)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        movePiece(1)
      } else if (event.key === 'ArrowDown') {
        event.preventDefault()
        stepDown()
      } else if (event.key === 'ArrowUp') {
        event.preventDefault()
        rotatePiece()
      } else if (event.key === ' ' || event.key === 'Spacebar') {
        event.preventDefault()
        hardDrop()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hardDrop, movePiece, rotatePiece, stepDown])

  const displayBoard = useMemo(
    () => mergeBoardWithPiece(game.board, game.piece),
    [game.board, game.piece],
  )

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 3, md: 6 } }}>
      <Stack spacing={3}>
        <Paper
          elevation={8}
          sx={{
            p: { xs: 2.5, md: 4 },
            background:
              'linear-gradient(180deg, rgba(17, 24, 39, 0.98), rgba(15, 23, 42, 0.92))',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={4} alignItems="stretch">
            <Box sx={{ flex: '0 0 auto', mx: { xs: 'auto', md: 0 } }}>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `repeat(${BOARD_WIDTH}, minmax(0, 1fr))`,
                  gap: 0.35,
                  p: 1,
                  borderRadius: 3,
                  bgcolor: 'rgba(2, 6, 23, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  boxShadow: '0 18px 40px rgba(0, 0, 0, 0.35)',
                }}
              >
                {displayBoard.flatMap((row, rowIndex) =>
                  row.map((cell, cellIndex) => (
                    <Box
                      key={`${rowIndex}-${cellIndex}`}
                      sx={{
                        width: { ...CELL_SIZE },
                        height: { ...CELL_SIZE },
                        borderRadius: 0.75,
                        bgcolor: cell || 'rgba(15, 23, 42, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.18)',
                        boxShadow: cell ? `inset 0 0 0 1px rgba(255,255,255,0.18), 0 0 12px ${cell}` : 'none',
                        transition: 'background-color 120ms ease-out',
                      }}
                    />
                  )),
                )}
              </Box>
            </Box>

            <Stack spacing={2.5} sx={{ flex: 1, minWidth: 0 }}>
              <Box>
                <Typography variant="overline" color="primary.light">
                  Falling Block Challenge
                </Typography>
                <Typography variant="h3" component="h1" sx={{ fontWeight: 700 }}>
                  Block Game
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Clear full rows, keep the stack low, and use the relaxed pace to plan ahead.
                </Typography>
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, flex: 1, bgcolor: 'rgba(15, 23, 42, 0.72)', borderColor: 'rgba(148, 163, 184, 0.16)' }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Score
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 700 }}>
                    {game.score}
                  </Typography>
                </Paper>

                <Paper
                  variant="outlined"
                  sx={{ p: 2, flex: 1, bgcolor: 'rgba(15, 23, 42, 0.72)', borderColor: 'rgba(148, 163, 184, 0.16)' }}
                >
                  <Typography variant="subtitle2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={game.gameOver ? 'Game Over' : 'Playing'}
                    color={game.gameOver ? 'error' : 'success'}
                    sx={{ mt: 1, fontWeight: 600 }}
                  />
                </Paper>
              </Stack>

              <Paper
                variant="outlined"
                sx={{ p: 2.5, bgcolor: 'rgba(15, 23, 42, 0.72)', borderColor: 'rgba(148, 163, 184, 0.16)' }}
              >
                <Typography variant="h6" sx={{ mb: 1.5 }}>
                  Controls
                </Typography>
                <Stack spacing={1}>
                  {controls.map(([key, label]) => (
                    <Stack
                      key={key}
                      direction="row"
                      alignItems="center"
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Chip label={key} size="small" variant="outlined" />
                      <Typography variant="body2" color="text.secondary">
                        {label}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>
              </Paper>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button variant="contained" size="large" onClick={resetGame}>
                  Restart Game
                </Button>
                {game.gameOver && (
                  <Typography variant="body2" color="error.light" sx={{ alignSelf: 'center' }}>
                    A new piece could not spawn. Restart to play again.
                  </Typography>
                )}
              </Stack>
            </Stack>
          </Stack>
        </Paper>
      </Stack>
    </Container>
  )
}

export default App
