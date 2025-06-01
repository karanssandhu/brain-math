import { useState, useEffect } from 'react';
import styles from '../styles/Numble.module.css';

export default function Home() {
  const [target, setTarget] = useState(''); // e.g., "3+2=5"
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState('');
  const [gameOver, setGameOver] = useState(false);

  // Generate a random equation on load
  useEffect(() => {
    const operators = ['+', '-', '*', '/'];
    let equation = '';
    while (true) {
      const a = Math.floor(Math.random() * 10);
      const b = Math.floor(Math.random() * 10);
      const op = operators[Math.floor(Math.random() * 4)];
      const result = eval(`${a}${op}${b}`);
      if (Number.isInteger(result) && result >= 0 && result <= 9) {
        equation = `${a}${op}${b}=${result}`;
        break;
      }
    }
    setTarget(equation);
  }, []);

  // Handle guess submission
  const handleSubmit = () => {
    if (currentGuess.length !== 5 || !currentGuess.includes('=')) return;
    if (!isValidEquation(currentGuess)) return;

    setGuesses([...guesses, currentGuess]);
    if (currentGuess === target || guesses.length === 5) setGameOver(true);
    setCurrentGuess('');
  };

  // Validate equation (e.g., "1+2=3" must be correct)
  const isValidEquation = (guess) => {
    const [left, right] = guess.split('=');
    return eval(left) === parseInt(right);
  };

  // Get feedback for each character
  const getFeedback = (guess) => {
    return guess.split('').map((char, i) => {
      if (target[i] === char) return 'green';
      if (target.includes(char)) return 'yellow';
      return 'gray';
    });
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Numble</h1>
      <div className={styles.grid}>
        {[...Array(6)].map((_, row) => (
          <div key={row} className={styles.row}>
            {guesses[row] ? (
              guesses[row].split('').map((char, col) => (
                <div
                  key={col}
                  className={styles.cell}
                  style={{ backgroundColor: getFeedback(guesses[row])[col] }}
                >
                  {char}
                </div>
              ))
            ) : row === guesses.length ? (
              currentGuess.padEnd(5, ' ').split('').map((char, col) => (
                <div key={col} className={styles.cell}>{char}</div>
              ))
            ) : (
              [...Array(5)].map((_, col) => (
                <div key={col} className={styles.cell}></div>
              ))
            )}
          </div>
        ))}
      </div>
      <input
        value={currentGuess}
        onChange={(e) => setCurrentGuess(e.target.value.slice(0, 5))}
        disabled={gameOver}
        className={styles.input}
        placeholder="e.g., 1+2=3"
      />
      <button onClick={handleSubmit} disabled={gameOver} className={styles.button}>
        Submit
      </button>
      {gameOver && (
        <p className={styles.message}>
          {guesses[guesses.length - 1] === target ? 'You Win!' : `Game Over! Answer: ${target}`}
        </p>
      )}
    </div>
  );
}