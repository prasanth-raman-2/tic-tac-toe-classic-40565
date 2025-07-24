import React, { useState, useEffect } from 'react';
import './App.css';

/**
 * A square on the tic tac toe board.
 * @param {object} props
 * @returns JSX.Element
 */
function Square({ value, onClick, disabled }) {
  return (
    <button
      className="ttt-square"
      onClick={onClick}
      disabled={disabled || !!value}
      aria-label={value ? `Square marked ${value}` : 'Empty square'}
    >
      {value}
    </button>
  );
}

/**
 * The Tic Tac Toe board component.
 * @param {object} props
 * @returns JSX.Element
 */
function Board({ squares, onSquareClick, disabled }) {
  return (
    <div className="ttt-board">
      {squares.map((row, rowIdx) => (
        <div key={rowIdx} className="ttt-row">
          {row.map((cell, colIdx) => (
            <Square
              key={colIdx}
              value={cell}
              onClick={() => onSquareClick(rowIdx, colIdx)}
              disabled={disabled}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function App() {
  // --- Game State Management ---
  const initialBoard = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];

  // X always goes first
  const [board, setBoard] = useState(initialBoard);
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [moveCount, setMoveCount] = useState(0);

  // Theme control (light/dark)
  const [theme, setTheme] = useState('light');

  // Effect to sync theme with document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Calculate winner every move
  useEffect(() => {
    const result = calculateWinner(board);
    setWinner(result);
  }, [board]);

  // Handle square press
  function handleSquareClick(row, col) {
    if (winner || board[row][col] !== '') return;
    const current = board.map(r => r.slice());
    current[row][col] = xIsNext ? 'X' : 'O';
    setBoard(current);
    setXIsNext(!xIsNext);
    setMoveCount(moveCount + 1);
  }

  // Handle reset
  function handleReset() {
    setBoard(initialBoard);
    setXIsNext(true);
    setWinner(null);
    setMoveCount(0);
  }

  // Calculate game status message
  let statusMsg;
  if (winner) {
    if (winner === 'Draw') {
      statusMsg = 'It\'s a Draw! 😐';
    } else {
      statusMsg = `Winner: ${winner} 🎉`;
    }
  } else {
    statusMsg = `Turn: ${xIsNext ? 'X' : 'O'}`;
  }

  return (
    <div className="App">
      <header className="ttt-header">
        <h1
          style={{
            color: 'var(--ttt-primary)'
          }}
        >Tic Tac Toe</h1>
        <button
          className="ttt-theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
          {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
        </button>
      </header>
      <main className="ttt-main-content">
        <div className="ttt-status" data-testid="ttt-status">
          {statusMsg}
        </div>
        <Board
          squares={board}
          onSquareClick={handleSquareClick}
          disabled={!!winner}
        />
        <button
          className="ttt-reset-btn"
          onClick={handleReset}
          aria-label="Reset Game"
        >
          Reset Game
        </button>
      </main>
      <footer className="ttt-footer">
        <span>
          <a
            href="https://reactjs.org/"
            className="ttt-footer-link"
            target="_blank"
            rel="noopener noreferrer"
          >Built with React</a>
        </span>
      </footer>
    </div>
  );
}

// PUBLIC_INTERFACE
function calculateWinner(squares) {
  /**
   * Returns "X" if X won, "O" if O won, "Draw" if board is full and no winner, or null if game ongoing.
   */
  const lines = [
    // Rows
    [[0, 0], [0, 1], [0, 2]],
    [[1, 0], [1, 1], [1, 2]],
    [[2, 0], [2, 1], [2, 2]],
    // Columns
    [[0, 0], [1, 0], [2, 0]],
    [[0, 1], [1, 1], [2, 1]],
    [[0, 2], [1, 2], [2, 2]],
    // Diagonals
    [[0, 0], [1, 1], [2, 2]],
    [[0, 2], [1, 1], [2, 0]]
  ];
  for (let line of lines) {
    const [[a1, a2], [b1, b2], [c1, c2]] = line;
    if (
      squares[a1][a2] &&
      squares[a1][a2] === squares[b1][b2] &&
      squares[a1][a2] === squares[c1][c2]
    ) {
      return squares[a1][a2];
    }
  }
  // Check for draw
  if (squares.every(row => row.every(cell => cell))) {
    return 'Draw';
  }
  return null;
}

export default App;
