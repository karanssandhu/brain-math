import { useState, useEffect } from 'react';
import seedrandom from 'seedrandom';
import styles from '../styles/Prome.module.css';

export default function Home() {
  // Keep existing state variables
  const [target, setTarget] = useState('');
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState(['', '', '', '']); // [a, op, b, c]
  const [gameOver, setGameOver] = useState(false);
  const [error, setError] = useState('');
  const [hint, setHint] = useState('');
  const [hintsUsed, setHintsUsed] = useState(0);
  // Add state for tracking input position
  const [inputMode, setInputMode] = useState('firstNumber'); // firstNumber, operator, secondNumber, result

  // Keep existing equation generation code unchanged...
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    const rng = seedrandom(today);
    
    const generateEquation = () => {
      const operators = [
        { symbol: '+', fn: (a, b) => a + b, min: 0, max: 99 },
        { symbol: '-', fn: (a, b) => a - b, min: 0, max: 99 },
        { symbol: '*', fn: (a, b) => a * b, min: 0, max: 99 },
        { symbol: '/', fn: (a, b) => a / b, min: 1, max: 99 }
      ];
      
      const difficulty = Math.floor(rng() * 3);
      let maxNum, attemptsLimit;
      switch(difficulty) {
        case 0:
          maxNum = 15;
          attemptsLimit = 50;
          break;
        case 1:
          maxNum = 30;
          attemptsLimit = 75;
          break;
        case 2:
          maxNum = 99;
          attemptsLimit = 100;
          break;
      }
  
      let equation = '';
      let attempts = 0;
      
      while (attempts < attemptsLimit) {
        const opIndex = Math.floor(rng() * operators.length);
        const op = operators[opIndex];
        
        let a, b, result;
        if (op.symbol === '/') {
          b = Math.floor(rng() * 9) + 1;
          result = Math.floor(rng() * 99) + 1;
          a = b * result;
        } else {
          a = Math.floor(rng() * maxNum);
          b = Math.floor(rng() * maxNum);
          result = op.fn(a, b);
        }
  
        if (
          Number.isInteger(result) &&
          result >= op.min &&
          result <= op.max &&
          result <= 99 &&
          a <= 99 && // Ensure first number is max 2 digits
          b <= 99 && // Ensure second number is max 2 digits
          (op.symbol !== '/' || (b !== 0 && a % b === 0)) &&
          (op.symbol !== '-' || result >= 0) &&
          (op.symbol !== '*' || (a > 1 || b > 1))
        ) {
          equation = `${a}${op.symbol}${b}=${result}`;
          
          if (
            (op.symbol === '+' && a !== 0 && b !== 0) ||
            (op.symbol === '-' && a !== b) ||
            (op.symbol === '*' && !(a === 1 || b === 1)) ||
            (op.symbol === '/')
          ) {
            break;
          }
        }
        attempts++;
      }
  
      if (!equation) {
        const fallbacks = [
          '15+15=30',
          '18-3=15',
          '12*4=48',
          '18/2=9'
        ];
        equation = fallbacks[Math.floor(rng() * fallbacks.length)];
      }
      
      return equation;
    };
  
    const newEquation = generateEquation();
    setTarget(newEquation);
    console.log('Target:', newEquation);
  }, []);

  // Keep existing hint generation code...
  const generateHint = () => {
    if (hintsUsed >= 3) {
      setError('No more hints available');
      return;
    }

    const [left, right] = target.split('=');
    const operator = left.match(/[+\-*/]/)[0];
    const [num1, num2] = left.split(/[+\-*/]/);
    const result = right;

    const hints = [
      `The result is ${parseInt(result) <= 9 ? 'a single digit' : 'a two-digit number'}`,
      `The operation used is ${
        operator === '+' ? 'addition' :
        operator === '-' ? 'subtraction' :
        operator === '*' ? 'multiplication' : 'division'
      }`,
      `One of the numbers used is ${Math.random() < 0.5 ? num1 : num2}`
    ];

    setHint(hints[hintsUsed]);
    setHintsUsed(prev => prev + 1);
  };

  // Updated handleKeyPress function with improved number input logic
  const handleKeyPress = (key) => {
    if (gameOver) return;
    
    if (key === '⌫') {
      const newGuess = [...currentGuess];
      // Find the rightmost non-empty position and clear it
      for (let i = newGuess.length - 1; i >= 0; i--) {
        if (newGuess[i] !== '') {
          if (i === 0) {
            newGuess[i] = '';
            setInputMode('firstNumber');
          } else if (i === 1) {
            newGuess[i] = '';
            setInputMode('operator');
          } else if (i === 2) {
            newGuess[i] = '';
            setInputMode('secondNumber');
          } else if (i === 3) {
            newGuess[i] = '';
            setInputMode('result');
          }
          setCurrentGuess(newGuess);
          break;
        }
      }
      return;
    }

    const newGuess = [...currentGuess];

    switch (inputMode) {
      case 'firstNumber':
        if (/\d/.test(key)) {
          const currentNum = newGuess[0];
          const newNum = currentNum + key;
          if (parseInt(newNum) <= 99) {
            newGuess[0] = newNum;
            if (parseInt(newNum) > 9) {
              setInputMode('operator');
            }
          }
        }
        break;

      case 'operator':
        if (['+', '-', '*', '/'].includes(key)) {
          newGuess[1] = key;
          setInputMode('secondNumber');
        }
        break;

      case 'secondNumber':
        if (/\d/.test(key)) {
          const currentNum = newGuess[2];
          const newNum = currentNum + key;
          if (parseInt(newNum) <= 99) {
            newGuess[2] = newNum;
            if (parseInt(newNum) > 9) {
              setInputMode('result');
            }
          }
        }
        break;

      case 'result':
        if (/\d/.test(key)) {
          const currentNum = newGuess[3];
          const newNum = currentNum + key;
          if (parseInt(newNum) <= 99) {
            newGuess[3] = newNum;
          }
        }
        break;
    }

    setCurrentGuess(newGuess);
    setError('');

    // Automatically advance input mode when appropriate
    if (newGuess[0] !== '' && inputMode === 'firstNumber') {
      setInputMode('operator');
    } else if (newGuess[1] !== '' && inputMode === 'operator') {
      setInputMode('secondNumber');
    } else if (newGuess[2] !== '' && inputMode === 'secondNumber') {
      setInputMode('result');
    }
  };

  // Keep existing submit, validation, and feedback functions...
  const handleSubmit = () => {
    if (currentGuess.includes('')) {
      setError('Fill all slots before submitting.');
      return;
    }
    const guess = `${currentGuess[0]}${currentGuess[1]}${currentGuess[2]}=${currentGuess[3]}`;
    if (!isValidEquation(guess)) {
      setError('Invalid equation or result doesn\'t match.');
      return;
    }
    setGuesses([...guesses, guess]);
    if (guess === target || guesses.length === 5) setGameOver(true);
    setCurrentGuess(['', '', '', '']);
    setInputMode('firstNumber');
    setError('');
  };

  const isValidEquation = (guess) => {
    const [left, right] = guess.split('=');
    try {
      const result = eval(left);
      const parsedRight = parseInt(right);
      return Number.isInteger(result) && 
             result === parsedRight && 
             result >= 0 && 
             result <= 99;
    } catch (e) {
      return false;
    }
  };

  const getFeedback = (guess) => {
    return guess.split('').map((char, i) => {
      if (target[i] === char) return 'green';
      if (target.includes(char)) return 'yellow';
      return 'gray';
    });
  };

  // Keep existing keyboard event handler...
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameOver) return;
      const key = e.key;
      if (key === 'Backspace') handleKeyPress('⌫');
      else if (key === 'Enter') handleSubmit();
      else if (/^[0-9+\-*/]$/.test(key)) handleKeyPress(key);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentGuess, gameOver, guesses, inputMode]);

  // Keep existing render code...
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Numble</h1>
      <div className={styles.grid}>
        {[...Array(6)].map((_, row) => (
          <div key={row} className={styles.row}>
            {row < guesses.length ? (
              guesses[row].split('').map((char, col) => (
                <div
                  key={col}
                  className={`${styles.cell} ${styles[getFeedback(guesses[row])[col]]} ${styles.flip}`}
                  style={{ transitionDelay: `${col * 0.1}s` }}
                >
                  {char}
                </div>
              ))
            ) : row === guesses.length ? (
              [currentGuess[0], currentGuess[1], currentGuess[2], '=', currentGuess[3]].map((char, col) => (
                <div key={col} className={styles.cell}>
                  {char}
                </div>
              ))
            ) : (
              [' ', ' ', ' ', '=', ' '].map((char, col) => (
                <div key={col} className={styles.cell}>
                  {char === '=' ? '=' : ''}
                </div>
              ))
            )}
          </div>
        ))}
      </div>
      <div className={styles.keyboard}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '-', '*', '/', '⌫'].map((key) => (
          <button
            key={key}
            className={styles.key}
            onClick={() => handleKeyPress(key)}
            disabled={gameOver}
          >
            {key}
          </button>
        ))}
        <button
          className={`${styles.key} ${styles.submit}`}
          onClick={handleSubmit}
          disabled={gameOver || currentGuess.includes('')}
        >
          Enter
        </button>
      </div>
      <div className={styles.hintSection}>
        <button
          className={`${styles.key} ${styles.hint}`}
          onClick={generateHint}
          disabled={gameOver || hintsUsed >= 3}
        >
          Get Hint ({3 - hintsUsed} left)
        </button>
        {hint && <p className={styles.hintText}>{hint}</p>}
      </div>
      {error && <p className={styles.error}>{error}</p>}
      {gameOver && (
        <p className={styles.message}>
          {guesses[guesses.length - 1] === target ? 'You Win!' : `Game Over! Answer: ${target}`}
        </p>
      )}
    </div>
  );
}