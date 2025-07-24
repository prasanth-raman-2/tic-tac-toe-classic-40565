import React, { useState, useEffect, useRef } from 'react';
import './App.css';

/**
 * Fetches commentary from OpenAI based on game state and latest move.
 * Uses environment variable for OPENAI_API_KEY (must be injected at build time!).
 * Handles errors and returns commentary (or error string).
 * @param {Array<Array>} board - 3x3 Array representing board.
 * @param {'X'|'O'} player - The player who just made the move
 * @param {Array} move - [row, col] of last move
 * @returns {Promise<string>} commentary
 */
async function fetchOpenAICommentary(board, player, move) {
  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;
  if (!apiKey) {
    return "Commentator unavailable (API key missing).";
  }

  // Prepare board as nice string for prompt
  const boardStr = board.map(row => row.map(c => c || "_").join(" ")).join("\n");
  const moveStr = move ? `Row ${move[0] + 1}, Column ${move[1] + 1}` : "N/A";

  // Prompt to explain game state, latest move, and description requirement
  const prompt = `
You are a witty sports commentator summarizing a Tic Tac Toe game for an audience. The current state of the game is:
${boardStr}
The most recent move was by ${player} at ${moveStr}.
Briefly describe the significance of this move and the game's state in 1-2 sentences. If someone is close to winning or a draw is near, mention it!
`;

  try {
    // Use fetch so it's compatible in browser (no Node.js openai SDK)
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: [{role: "user", content: prompt}],
        max_tokens: 50,
        temperature: 0.8
      })
    });
    if (!response.ok) {
      throw new Error("OpenAI API error");
    }
    const data = await response.json();
    if (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) {
      return data.choices[0].message.content.trim();
    } else {
      return "Commentator: (No commentary returned.)";
    }
  } catch (err) {
    return "Commentator error: Unable to contact OpenAI.";
  }
}

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

/**
 * The main Tic Tac Toe App with OpenAI-based commentator.
 */
function App() {
  // --- Game State Management ---
  const initialBoard = [
    ['', '', ''],
    ['', '', ''],
    ['', '', '']
  ];

  // Board state & turn info
  const [board, setBoard] = useState(initialBoard);
  const [xIsNext, setXIsNext] = useState(true);
  const [winner, setWinner] = useState(null);
  const [moveCount, setMoveCount] = useState(0);

  // --- Commentator State ---
  const [commentary, setCommentary] = useState("");     // Commentary for display
  const [isLoading, setIsLoading] = useState(false);    // For loading spinner/status
  const lastMoveRef = useRef(null);                     // Store last move details for api

  // Theme control (light/dark)
  const [theme, setTheme] = useState('light');

  // Sync theme with document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // PUBLIC_INTERFACE
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Calculate winner every move and trigger commentary if there was a move
  useEffect(() => {
    const result = calculateWinner(board);
    setWinner(result);

    // Only send to commentator if there was a move (not on reset/initial mount)
    if (lastMoveRef.current && !result) {
      setIsLoading(true);
      setCommentary(""); // Clear previous
      const player = !xIsNext ? "X" : "O"; // Because state was just flipped
      fetchOpenAICommentary(board, player, lastMoveRef.current)
        .then(msg => setCommentary(msg))
        .catch(() => setCommentary("Commentator: Error getting commentary."))
        .finally(() => setIsLoading(false));
    } else if (result && lastMoveRef.current) {
      // Game ended, give a final commentary
      setIsLoading(true);
      // Winner could be 'Draw' or 'X' or 'O'
      const player = !xIsNext ? "X" : "O";
      fetchOpenAICommentary(board, player, lastMoveRef.current)
        .then(msg => setCommentary(msg + " [Game Over]"))
        .catch(() => setCommentary("Commentator: Error getting commentary."))
        .finally(() => setIsLoading(false));
    } else if (!lastMoveRef.current) {
      setCommentary("");
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, [board]);

  // Called when a board square is clicked
  function handleSquareClick(row, col) {
    if (winner || board[row][col] !== '') return;
    const current = board.map(r => r.slice());
    current[row][col] = xIsNext ? 'X' : 'O';
    setBoard(current);
    setXIsNext(!xIsNext);
    setMoveCount(moveCount + 1);
    lastMoveRef.current = [row, col];
  }

  // Handle reset
  function handleReset() {
    setBoard(initialBoard);
    setXIsNext(true);
    setWinner(null);
    setMoveCount(0);
    setCommentary("");
    setIsLoading(false);
    lastMoveRef.current = null;
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
        {/* Commentator section */}
        <div
          className="ttt-commentator"
          style={{
            minHeight: '2.7rem',
            margin: "1.5rem auto 0 auto",
            width: "100%",
            textAlign: "center",
            color: "var(--ttt-primary)",
            fontStyle: "italic",
            fontWeight: 500,
            fontSize: "1.11rem"
          }}
        >
          {isLoading
            ? <span style={{color: 'gray'}}>Commentator: Thinking...</span>
            : commentary && <span>{commentary}</span>
          }
        </div>
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
