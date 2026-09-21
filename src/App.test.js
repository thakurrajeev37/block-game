import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Tetris game heading', () => {
  render(<App />);
  expect(screen.getByText('TETRIS')).toBeInTheDocument();
});

test('renders the Start button', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /start/i })).toBeInTheDocument();
});
