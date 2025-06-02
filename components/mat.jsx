import React, { useState, useEffect, memo, useRef } from 'react';
import { evaluate } from 'mathjs';
import { Calculator, RefreshCw, Check, X, ArrowLeft, Trophy, HelpCircle, Settings, Share, Star, User, TrendingUp, History, Sliders } from 'lucide-react';
import Head from 'next/head';
import { useSwipeable } from 'react-swipeable';

// Scientist-themed level concepts
const LEVEL_CONCEPTS = {
  NEWTON: { 
    name: "Newton's Basics", 
    scientist: "Isaac Newton",
    description: "Simple arithmetic operations", 
    icon: "🍎",
    operations: ['+', '-', '*', '/'],
    minNumbers: 3,
    maxNumbers: 4,
    targetRange: { min: 99, max: 199 },
    timeLimit: 60,
    baseScore: 100,
    mustUseAll: false
  },
  EULER: { 
    name: "Euler's Expressions", 
    scientist: "Leonhard Euler",
    description: "Powers and roots join the party", 
    icon: "🔢",
    operations: ['+', '-', '*', '/', '^', 'sqrt('],
    minNumbers: 3,
    maxNumbers: 5,
    targetRange: { min: 99, max: 399 },
    timeLimit: 90,
    baseScore: 150,
    mustUseAll: false
  },
  GAUSS: { 
    name: "Gauss's Challenge", 
    scientist: "Carl Friedrich Gauss",
    description: "Factorials and complex combinations", 
    icon: "📐",
    operations: ['+', '-', '*', '/', '^', 'sqrt(', 'cbrt(', '!'],
    minNumbers: 4,
    maxNumbers: 5,
    targetRange: { min: 99, max: 499 },
    timeLimit: 180,
    baseScore: 200,
    mustUseAll: false
  },
  FIBONACCI: { 
    name: "Fibonacci's Quest", 
    scientist: "Leonardo Fibonacci",
    description: "Use ALL numbers in elegant sequences", 
    icon: "🌀",
    operations: ['+', '-', '*', '/', '^', 'sqrt(', 'cbrt(', '!'],
    minNumbers: 4,
    maxNumbers: 6,
    targetRange: { min: 99, max: 599 },
    timeLimit: 240,
    baseScore: 300,
    mustUseAll: true
  },
  CUSTOM: {
    name: "Custom Challenge",
    scientist: "Your Rules",
    description: "Create your own difficulty",
    icon: "⚙️",
    operations: ['+', '-', '*', '/', '^', 'sqrt(', 'cbrt(', '!'],
    minNumbers: 3,
    maxNumbers: 6,
    targetRange: { min: 99, max: 500 },
    timeLimit: 180,
    baseScore: 100,
    mustUseAll: false
  }
};

// Generate unique random integers between 0 and 9
const generateUniqueNumbers = (count, excludeTarget = null) => {
  const numbers = new Set();
  while (numbers.size < count) {
    const num = Math.floor(Math.random() * 10);
    if (num !== excludeTarget) {
      numbers.add(num);
    }
  }
  return Array.from(numbers);
};

// Progressive difficulty adjustment
const adjustDifficultyForSession = (concept, sessionStats) => {
  const { gamesPlayed, gamesWon } = sessionStats;
  const winRate = gamesPlayed > 0 ? gamesWon / gamesPlayed : 0;

  let adjustment = { ...concept };

  if (winRate > 0.8 && gamesPlayed >= 3) {
    adjustment.targetRange.max = Math.min(adjustment.targetRange.max * 1.2, 500);
    adjustment.timeLimit = Math.max(adjustment.timeLimit * 0.9, 60);
  } else if (winRate < 0.3 && gamesPlayed >= 3) {
    adjustment.targetRange.max = Math.max(adjustment.targetRange.max * 0.8, 20);
    adjustment.timeLimit = Math.min(adjustment.timeLimit * 1.1, 300);
  }

  return adjustment;
};

// Generate expression with available operations
const generateRandomExpression = (numbers, availableOps, mustUseAll = false) => {
  const numbersToUse = mustUseAll ? numbers : numbers.slice(0, Math.floor(Math.random() * numbers.length) + 1);

  if (numbersToUse.length === 1) return { expr: numbersToUse[0].toString(), value: numbersToUse[0] };

  const index = Math.floor(Math.random() * (numbersToUse.length - 1)) + 1;
  const left = numbersToUse.slice(0, index);
  const right = numbersToUse.slice(index);
  const leftResult = generateRandomExpression(left, availableOps, false);
  const rightResult = generateRandomExpression(right, availableOps, false);

  let validOps = availableOps.filter(op => 
    op === '+' || op === '-' || op === '*' || 
    (op === '/' && rightResult.value !== 0) ||
    (op === '^' && rightResult.value <= 3)
  );

  if (validOps.length === 0) validOps = ['+', '-', '*'];

  const op = validOps[Math.floor(Math.random() * validOps.length)];
  let value;

  if (op === '+') value = leftResult.value + rightResult.value;
  else if (op === '-') value = leftResult.value - rightResult.value;
  else if (op === '*') value = leftResult.value * rightResult.value;
  else if (op === '/') value = leftResult.value / rightResult.value;
  else if (op === '^') value = Math.pow(leftResult.value, rightResult.value);

  const expr = `(${leftResult.expr} ${op === '^' ? '^' : op} ${rightResult.expr})`;
  return { expr, value };
};

// Helper function to evaluate expression
const evaluateExpression = (expr) => {
  let processedExpr = expr
    .replace(/sqrt\(/g, 'sqrt(')
    .replace(/cbrt\(/g, 'nthRoot(')
    .replace(/!/g, ' factorial ')
    .replace(/\^/g, '^');

  processedExpr = processedExpr.replace(/cbrt\(([^)]+)\)/g, 'nthRoot($1, 3)');

  return evaluate(processedExpr);
};

// Memoized components
// const NumberButtons = memo(({ numbers, usedNumbers, insertAtCursor }) => (
//   <div className="space-y-3">
//     <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Numbers</p>
//     <div className="grid grid-cols-3 gap-2 sm:gap-3">
//       {numbers.map((num, i) => (
//         <button
//           key={i}
//           onClick={() => !usedNumbers.includes(num) && insertAtCursor(num.toString())}
//           className={`h-12 sm:h-14 text-lg sm:text-xl font-semibold rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
//             usedNumbers.includes(num)
//               ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-60'
//               : 'bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700'
//           }`}
//           disabled={usedNumbers.includes(num)}
//         >
//           {num}
//         </button>
//       ))}
//     </div>
//   </div>
// ));

const NumberButtons = memo(({ numbers, usedNumbers, insertAtCursor }) => (
  <div className="space-y-3">
    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Available Numbers</p>
    <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4 lg:grid-cols-6">
      {numbers.map((num, i) => (
        <button
          key={i}
          onClick={() => !usedNumbers.includes(num) && insertAtCursor(num.toString())}
          onTouchStart={() => !usedNumbers.includes(num) && navigator.vibrate?.(50)} // Haptic feedback
          className={`h-12 sm:h-14 text-lg sm:text-xl font-semibold rounded-lg shadow-sm transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-action-manipulation ${
            usedNumbers.includes(num)
              ? 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-60'
              : 'bg-blue-100 dark:bg-blue-800 hover:bg-blue-200 dark:hover:bg-blue-700'
          }`}
          disabled={usedNumbers.includes(num)}
          aria-label={`Number ${num}`}
        >
          {num}
        </button>
      ))}
    </div>
  </div>
));

// const OperationButtons = memo(({ availableOps, insertAtCursor }) => {
//   const basicOps = availableOps.filter(op => ['+', '-', '*', '/', '^', '(', ')'].includes(op));
//   const advancedOps = [
//     { symbol: '!', display: 'n!', title: 'Factorial', available: availableOps.includes('!') },
//     { symbol: 'sqrt(', display: '√', title: 'Square Root', available: availableOps.includes('sqrt(') },
//     { symbol: 'cbrt(', display: '∛', title: 'Cube Root', available: availableOps.includes('cbrt(') },
//   ].filter(op => op.available);

//   return (
//     <div className="space-y-3">
//       <div>
//         <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Basic Operations</p>
//         <div className="grid grid-cols-4 gap-2 sm:gap-3">
//           {[...basicOps, '(', ')'].map((op) => (
//             <button
//               key={op}
//               onClick={() => insertAtCursor(` ${op} `)}
//               className="h-12 sm:h-14 text-lg sm:text-xl font-mono bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500"
//             >
//               {op}
//             </button>
//           ))}
//         </div>
//       </div>

//       {advancedOps.length > 0 && (
//         <div>
//           <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Advanced Functions</p>
//           <div className="grid grid-cols-3 gap-2 sm:gap-3">
//             {advancedOps.map((func) => (
//               <button
//                 key={func.symbol}
//                 onClick={() => insertAtCursor(func.symbol)}
//                 className="h-10 text-sm font-mono bg-purple-100 dark:bg-purple-800 rounded-lg shadow-sm hover:bg-purple-200 dark:hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500"
//                 title={func.title}
//               >
//                 {func.display}
//               </button>
//             ))}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// });

const OperationButtons = memo(({ availableOps, insertAtCursor }) => {
  const basicOps = availableOps.filter(op => ['+', '-', '*', '/', '^', '(', ')'].includes(op));
  const advancedOps = [
    { symbol: '!', display: 'n!', title: 'Factorial', available: availableOps.includes('!') },
    { symbol: 'sqrt(', display: '√', title: 'Square Root', available: availableOps.includes('sqrt(') },
    { symbol: 'cbrt(', display: '∛', title: 'Cube Root', available: availableOps.includes('cbrt(') },
  ].filter(op => op.available);

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Basic Operations</p>
        <div className="grid grid-cols-4 gap-2 sm:gap-3 md:grid-cols-5">
          {[...basicOps, '(', ')'].map((op) => (
            <button
              key={op}
              onClick={() => insertAtCursor(` ${op} `)}
              onTouchStart={() => navigator.vibrate?.(50)}
              className="h-12 sm:h-14 text-lg sm:text-xl font-mono bg-gray-100 dark:bg-gray-800 rounded-lg shadow-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 touch-action-manipulation"
              aria-label={`Operation ${op}`}
            >
              {op}
            </button>
          ))}
        </div>
      </div>
      {advancedOps.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Advanced Functions</p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3 md:grid-cols-4">
            {advancedOps.map((func) => (
              <button
                key={func.symbol}
                onClick={() => insertAtCursor(func.symbol)}
                onTouchStart={() => navigator.vibrate?.(50)}
                className="h-10 sm:h-12 text-sm sm:text-base font-mono bg-purple-100 dark:bg-purple-800 rounded-lg shadow-sm hover:bg-purple-200 dark:hover:bg-purple-700 transition-all duration-200 transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-purple-500 touch-action-manipulation"
                title={func.title}
                aria-label={func.title}
              >
                {func.display}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});


const MathGame = () => {
  const [gameState, setGameState] = useState('MENU');
  const [currentConcept, setCurrentConcept] = useState(null);
  const [customSettings, setCustomSettings] = useState({
    minTarget: 10,
    maxTarget: 100,
    numberCount: 4,
    timeLimit: 180,
    operations: ['+', '-', '*', '/'],
    mustUseAll: false,
  });
  const [numbers, setNumbers] = useState([]);
  const [target, setTarget] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [liveResult, setLiveResult] = useState('--');
  const [message, setMessage] = useState('');
  const [score, setScore] = useState(0);
  const [solutions, setSolutions] = useState([]);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [timeLeft, setTimeLeft] = useState(0);
  const [sessionStats, setSessionStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalTime: 0,
    averageTime: 0,
    currentStreak: 0,
    history: [],
  });
  const [overallStats, setOverallStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    winRate: 0,
    highScore: 0,
    longestStreak: 0,
    levelProgress: {},
  });

  const inputRef = useRef(null);
  const isInputFocused = useRef(false);

  const handleInputFocus = () => {
    isInputFocused.current = true;
  };

  const handleInputBlur = () => {
    isInputFocused.current = false;
  };

  const insertAtCursor = (text) => {
    const input = inputRef.current;
    if (!input) return;

    const start = input.selectionStart || 0;
    const end = input.selectionEnd || 0;
    const newValue = userInput.substring(0, start) + text + userInput.substring(end);

    setUserInput(newValue);

    setTimeout(() => {
      const newCursorPos = start + text.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);
  };

  useEffect(() => {
    if (!userInput.trim()) {
      setLiveResult('--');
      return;
    }
    try {
      const result = evaluateExpression(userInput);
      setLiveResult(Number.isInteger(result) ? result : result.toFixed(2));
    } catch {
      setLiveResult('Invalid');
    }
  }, [userInput]);

  const updateStats = (won, scoreToAdd = 0, timeTaken = 0, problemData = null) => {
    setSessionStats(prev => {
      const newHistory = problemData ? [...prev.history, problemData] : prev.history;
      return {
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: won ? prev.gamesWon + 1 : prev.gamesWon,
        totalTime: prev.totalTime + timeTaken,
        averageTime: (prev.totalTime + timeTaken) / (prev.gamesPlayed + 1),
        currentStreak: won ? prev.currentStreak + 1 : 0,
        history: newHistory,
      };
    });

    setOverallStats(prev => {
      const newGamesPlayed = prev.gamesPlayed + 1;
      const newGamesWon = won ? prev.gamesWon + 1 : prev.gamesWon;
      const newLongestStreak = Math.max(prev.longestStreak, sessionStats.currentStreak + (won ? 1 : 0));

      return {
        gamesPlayed: newGamesPlayed,
        gamesWon: newGamesWon,
        totalScore: prev.totalScore + scoreToAdd,
        highScore: Math.max(prev.highScore, scoreToAdd),
        winRate: ((newGamesWon / newGamesPlayed) * 100).toFixed(1),
        longestStreak: newLongestStreak,
        levelProgress: {
          ...prev.levelProgress,
          [currentConcept]: (prev.levelProgress[currentConcept] || 0) + (won ? 1 : 0),
        },
      };
    });
  };

  const startGame = (conceptKey, isCustom = false) => {
    let concept = isCustom ? {
      ...LEVEL_CONCEPTS.CUSTOM,
      targetRange: { min: customSettings.minTarget, max: customSettings.maxTarget },
      timeLimit: customSettings.timeLimit,
      operations: customSettings.operations,
      mustUseAll: customSettings.mustUseAll,
    } : LEVEL_CONCEPTS[conceptKey];

    if (!isCustom) {
      concept = adjustDifficultyForSession(concept, sessionStats);
    }

    let solution, targetValue, gameNumbers;
    const numberCount = isCustom ? customSettings.numberCount : 
      Math.floor(Math.random() * (concept.maxNumbers - concept.minNumbers + 1)) + concept.minNumbers;

    do {
      const tempNumbers = generateUniqueNumbers(numberCount);
      solution = generateRandomExpression(tempNumbers, concept.operations, concept.mustUseAll);
      targetValue = solution.value;

      if (targetValue >= 0 && targetValue <= 10 && Number.isInteger(targetValue)) {
        gameNumbers = generateUniqueNumbers(numberCount, targetValue);
      } else {
        gameNumbers = tempNumbers;
      }
    } while (
      !Number.isInteger(targetValue) || 
      isNaN(targetValue) || 
      !isFinite(targetValue) || 
      targetValue < concept.targetRange.min ||
      targetValue > concept.targetRange.max ||
      gameNumbers.includes(targetValue)
    );

    setCurrentConcept(conceptKey);
    setNumbers(gameNumbers);
    setTarget(targetValue);
    setSolutions([solution.expr]);
    setGameState('PLAYING');
    setUserInput('');
    setLiveResult('--');
    setMessage('');
  };

  const checkSolution = () => {
    if (!userInput.trim()) return setMessage('Please enter a solution');

    const concept = LEVEL_CONCEPTS[currentConcept];
    const numberMatches = userInput.match(/\d+/g) || [];
    const usedDigits = [];

    for (const numStr of numberMatches) {
      const digits = numStr.split('').map(d => parseInt(d));
      for (const digit of digits) {
        if (!numbers.includes(digit)) {
          return setMessage(`Digit ${digit} not available in provided numbers`);
        }
        usedDigits.push(digit);
      }
    }

    const digitCounts = {};
    const availableCounts = {};

    numbers.forEach(num => {
      availableCounts[num] = (availableCounts[num] || 0) + 1;
    });

    usedDigits.forEach(digit => {
      digitCounts[digit] = (digitCounts[digit] || 0) + 1;
    });

    for (const [digit, count] of Object.entries(digitCounts)) {
      if (count > (availableCounts[digit] || 0)) {
        return setMessage(`Used digit ${digit} more times than available`);
      }
    }

    if (concept.mustUseAll && usedDigits.length !== numbers.length) {
      return setMessage('You must use ALL numbers for this level!');
    }

    try {
      const result = evaluateExpression(userInput);
      const timeTaken = concept.timeLimit - (concept.timeLimit - timeLeft); // Note: timeLeft is no longer managed here
      const timeBonus = Math.floor(timeLeft * (concept.baseScore / concept.timeLimit));
      const scoreToAdd = Math.abs(result - target) < 1e-9 ? concept.baseScore + timeBonus : 0;

      const problemData = {
        target,
        numbers: [...numbers],
        userSolution: userInput,
        correctSolution: solutions[0],
        solved: scoreToAdd > 0,
        score: scoreToAdd,
        timeTaken,
        concept: currentConcept,
        timestamp: new Date().toISOString(),
      };

      if (scoreToAdd > 0) {
        setScore(scoreToAdd);
        setGameState('SUCCESS');
        setMessage(`Excellent! Earned ${scoreToAdd} points!`);

        if (sessionStats.currentStreak > 0 && sessionStats.currentStreak % 3 === 0) {
          setCurrentLevel(prev => prev + 1);
        }
      } else {
        setMessage('Incorrect solution. Try again!');
      }

      updateStats(scoreToAdd > 0, scoreToAdd, timeTaken, problemData);
    } catch (error) {
      setMessage('Invalid expression: ' + error.message);
    }
  };

  const handleTimeOut = () => {
    const concept = LEVEL_CONCEPTS[currentConcept];
    const timeTaken = concept.timeLimit;
    const problemData = {
      target,
      numbers: [...numbers],
      userSolution: userInput,
      correctSolution: solutions[0],
      solved: false,
      score: 0,
      timeTaken,
      concept: currentConcept,
      timestamp: new Date().toISOString(),
    };

    setGameState('GAME_OVER');
    setMessage("Time's up!");
    updateStats(false, 0, timeTaken, problemData);
  };

  const ProgressBar = ({ value, className = "" }) => (
    <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden ${className}`}>
      <div 
        className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-300 ease-in-out" 
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );

  const Timer = memo(({ initialTime, onTimeOut }) => {
    const [timeLeft, setTimeLeft] = useState(initialTime);
  
    useEffect(() => {
      setTimeLeft(initialTime); // Reset timeLeft when initialTime changes
      const timer = setInterval(() => {
        setTimeLeft((t) => {
          const newTime = t - 1;
          if (newTime <= 0) {
            clearInterval(timer);
            onTimeOut();
            return 0;
          }
          return newTime;
        });
      }, 1000);
  
      return () => clearInterval(timer);
    }, [initialTime, onTimeOut]);
  
    return (
      <div>
        <ProgressBar value={(timeLeft / initialTime) * 100} />
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
        </p>
      </div>
    );
  });
  

  const Badge = ({ children, className = "" }) => (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${className}`}>
      {children}
    </span>
  );

  const Card = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg transition-all duration-300 ${className}`}>
      {children}
    </div>
  );

  const Button = ({ children, onClick, disabled, variant = "default", size = "default", className = "" }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95";
    const variantClasses = {
      default: "bg-gradient-to-r from-blue-500 to-indigo-500 text-white hover:from-blue-600 hover:to-indigo-600 focus:ring-blue-500",
      outline: "border-2 border-gray-300 dark:border-gray-600 bg-transparent text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-blue-500",
      ghost: "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:ring-blue-500",
      destructive: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    };
    const sizeClasses = {
      default: "h-10 px-4 text-base",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-6 text-lg",
      icon: "h-10 w-10",
    };

    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      >
        {children}
      </button>
    );
  };

  const Alert = ({ children, variant = "default", className = "" }) => {
    const variantClasses = {
      default: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
      info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
      success: "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
      warning: "bg-yellow-50 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200",
      destructive: "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    };

    return (
      <div className={`rounded-lg border p-4 animate-slide-up ${variantClasses[variant]} ${className}`}>
        {children}
      </div>
    );
  };

  // const Dialog = ({ open, onOpenChange, children }) => {
  //   if (!open) return null;

  //   return (
  //     <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
  //       <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" onClick={() => onOpenChange(false)} />
  //       <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
  //         {children}
  //       </div>
  //     </div>
  //   );
  // };

  const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;
  
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300" 
          onClick={() => onOpenChange(false)} 
          role="button"
          aria-label="Close dialog"
        />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md sm:max-w-lg md:max-w-xl max-h-[80vh] sm:max-h-[90vh] overflow-y-auto animate-scale-in">
          {children}
        </div>
      </div>
    );
  };

  const DialogContent = ({ children, className = "" }) => (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );

  const DialogHeader = ({ children }) => (
    <div className="mb-4">
      {children}
    </div>
  );

  const DialogTitle = ({ children }) => (
    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
      {children}
    </h2>
  );

  const DialogDescription = ({ children }) => (
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
      {children}
    </p>
  );

  // const GameHeader = () => (
  //   <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 shadow-lg sticky top-0 z-40">
  //     <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
  //       <Button variant="ghost" size="icon" onClick={() => setShowQuitDialog(true)} className="text-white hover:bg-blue-700">
  //         <ArrowLeft className="h-5 w-5" />
  //       </Button>
  //       <div className="text-center">
  //         <h1 className="text-2xl sm:text-3xl font-extrabold tracking-wide">MATHLE</h1>
  //         {currentConcept && (
  //           <p className="text-sm sm:text-base opacity-90">
  //             Level {currentLevel} • {LEVEL_CONCEPTS[currentConcept].scientist}
  //           </p>
  //         )}
  //       </div>
  //       <div className="flex gap-2">
  //         <Button variant="ghost" size="icon" onClick={() => setShowHistoryDialog(true)} className="text-white hover:bg-blue-700">
  //           <History className="h-5 w-5" />
  //         </Button>
  //         <Button variant="ghost" size="icon" onClick={() => setShowHelpDialog(true)} className="text-white hover:bg-blue-700">
  //           <HelpCircle className="h-5 w-5" />
  //         </Button>
  //       </div>
  //     </div>
  //   </header>
  // );

  const GameHeader = () => (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 sm:py-4 shadow-lg sticky top-0 z-40">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setShowQuitDialog(true)} className="text-white hover:bg-blue-700">
          <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold tracking-wide">MATHLE</h1>
          {currentConcept && (
            <p className="text-xs sm:text-sm md:text-base opacity-90">
              Level {currentLevel} • {LEVEL_CONCEPTS[currentConcept].scientist}
            </p>
          )}
        </div>
        <div className="flex gap-1 sm:gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowHistoryDialog(true)} className="text-white hover:bg-blue-700">
            <History className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowHelpDialog(true)} className="text-white hover:bg-blue-700">
            <HelpCircle className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>
      </div>
    </header>
  );

  const MenuScreen = () => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8 animate-fade-in">
      <Head>
        <title>Mathle - Math Puzzle Game</title>
        <meta name="description" content="Challenge your math skills with Mathle, a fun and engaging puzzle game inspired by legendary scientists." />
      </Head>
      <div className="text-center space-y-4">
        <h2 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
          Welcome to Mathle
        </h2>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300">
          Master mathematics with legendary scientists • Level {currentLevel}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: "Session Streak", value: sessionStats.currentStreak, icon: "🔥" },
          { label: "Session Games", value: `${sessionStats.gamesWon}/${sessionStats.gamesPlayed}`, icon: "🎯" },
          { label: "Total Score", value: overallStats.totalScore, icon: "🏆" },
          { label: "Win Rate", value: `${overallStats.winRate}%`, icon: "📊" },
        ].map((stat, i) => (
          <Card
            key={i}
            className="p-4 sm:p-6 text-center transform hover:scale-105 transition-transform duration-300"
          >
            <div className="text-2xl sm:text-3xl mb-2">{stat.icon}</div>
            <p className="text-lg sm:text-xl font-bold">{stat.value}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <h3 className="text-xl sm:text-2xl font-semibold text-gray-800 dark:text-gray-200">Choose Your Scientist</h3>
          <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowCustomDialog(true)}
            className="flex items-center gap-2"
          >
            <Sliders className="h-4 w-4" />
            Custom Level
          </Button>
          {/* Game history button to show all the games played */}
          <Button 
            variant="outline" 
            onClick={() => setShowHistoryDialog(true)}
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            History
          </Button>
          </div>
          
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Object.entries(LEVEL_CONCEPTS).filter(([key]) => key !== 'CUSTOM').map(([key, concept]) => {
            const progress = overallStats.levelProgress[key] || 0;
            const isUnlocked = key === 'NEWTON' || (overallStats.levelProgress[Object.keys(LEVEL_CONCEPTS)[Object.keys(LEVEL_CONCEPTS).indexOf(key) - 1]] || 0) >= 3;

            return (
              <button
                key={key}
                onClick={() => isUnlocked && startGame(key)}
                disabled={!isUnlocked}
                className={`p-4 sm:p-6 rounded-xl shadow-lg transition-all duration-300 text-left transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  isUnlocked 
                    ? 'bg-white dark:bg-gray-800 hover:shadow-xl cursor-pointer' 
                    : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl sm:text-3xl">{concept.icon}</span>
                  {!isUnlocked && <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded">🔒</span>}
                </div>
                <h4 className="font-bold text-lg sm:text-xl">{concept.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{concept.scientist}</p>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{concept.description}</p>
                <div className="mt-3">
                  <ProgressBar value={(progress / 3) * 100} className="mt-2" />
                  <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Progress: {progress}/3 {isUnlocked ? 'Completed' : 'to Unlock'}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const CustomLevelDialog = () => (
    <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom Challenge Setup</DialogTitle>
          <DialogDescription>Create your own math puzzle</DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Number of Numbers ({customSettings.numberCount})
            </label>
            <input
              type="range"
              min="3"
              max="6"
              value={customSettings.numberCount}
              onChange={(e) => setCustomSettings({ ...customSettings, numberCount: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Range ({customSettings.minTarget} - {customSettings.maxTarget})
            </label>
            <div className="flex gap-3">
              <input
                type="number"
                min="1"
                max="100"
                value={customSettings.minTarget}
                onChange={(e) => setCustomSettings({ ...customSettings, minTarget: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="number"
                min={customSettings.minTarget}
                max="500"
                value={customSettings.maxTarget}
                onChange={(e) => setCustomSettings({ ...customSettings, maxTarget: parseInt(e.target.value) })}
                className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Time Limit ({customSettings.timeLimit}s)
            </label>
            <input
              type="range"
              min="60"
              max="300"
              step="10"
              value={customSettings.timeLimit}
              onChange={(e) => setCustomSettings({ ...customSettings, timeLimit: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Operations
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LEVEL_CONCEPTS.CUSTOM.operations.map((op) => (
                <label key={op} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={customSettings.operations.includes(op)}
                    onChange={(e) => {
                      const newOps = e.target.checked
                        ? [...customSettings.operations, op]
                        : customSettings.operations.filter((o) => o !== op);
                      setCustomSettings({ ...customSettings, operations: newOps });
                    }}
                    className="h-4 w-4 text-blue-500 focus:ring-blue-500"
                  />
                  {op === 'sqrt(' ? '√' : op === 'cbrt(' ? '∛' : op === '!' ? 'n!' : op}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={customSettings.mustUseAll}
                onChange={(e) => setCustomSettings({ ...customSettings, mustUseAll: e.target.checked })}
                className="h-4 w-4 text-blue-500 focus:ring-blue-500"
              />
              Must Use All Numbers
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              startGame('CUSTOM', true);
              setShowCustomDialog(false);
            }}
            disabled={customSettings.operations.length === 0}
          >
            Start Custom Game
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const HistoryDialog = () => (
    <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Game History</DialogTitle>
          <DialogDescription>Your session performance</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {sessionStats.history.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No games played in this session.</p>
          ) : (
            sessionStats.history.map((game, i) => (
              <Card key={i} className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <div>
                    <p className="font-medium">
                      {LEVEL_CONCEPTS[game.concept].name} • {game.timestamp.slice(0, 10)}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Target: {game.target} | Numbers: {game.numbers.join(', ')}
                    </p>
                    <p className="text-sm">
                      Your Solution: {game.userSolution || 'None'}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Correct Solution: {game.correctSolution}
                    </p>
                  </div>
                  <Badge className={game.solved ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}>
                    {game.solved ? 'Solved' : 'Failed'} • {game.score} pts
                  </Badge>
                </div>
              </Card>
            ))
          )}
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setShowHistoryDialog(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const HelpDialog = () => (
    <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>How to Play Mathle</DialogTitle>
          <DialogDescription>Learn the rules and tips</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Use the given numbers and available operations to reach the target number.
          </p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Click numbers and operations to build your expression.</li>
            <li>Each number can be used at most once unless otherwise specified.</li>
            <li>Some levels require using ALL numbers.</li>
            <li>Earn points based on difficulty and remaining time.</li>
            <li>Complete 3 successful games to unlock the next scientist level.</li>
          </ul>
          <h4 className="font-medium">Tips</h4>
          <ul className="list-disc pl-5 space-y-2 text-sm text-gray-600 dark:text-gray-400">
            <li>Try simple operations first before using advanced functions.</li>
            <li>Parentheses can change the order of operations.</li>
            <li>Monitor the live result to see if you're close to the target.</li>
          </ul>
        </div>
        <div className="mt-4 flex justify-end">
          <Button variant="outline" onClick={() => setShowHelpDialog(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  const QuitDialog = () => (
    <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quit Game?</DialogTitle>
          <DialogDescription>Are you sure you want to return to the menu? Your current progress will be saved.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setShowQuitDialog(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              setGameState('MENU');
              setShowQuitDialog(false);
              const timeTaken = LEVEL_CONCEPTS[currentConcept].timeLimit - timeLeft;
              const problemData = {
                target,
                numbers: [...numbers],
                userSolution: userInput,
                correctSolution: solutions[0],
                solved: false,
                score: 0,
                timeTaken,
                concept: currentConcept,
                timestamp: new Date().toISOString(),
              };
              updateStats(false, 0, timeTaken, problemData);
            }}
          >
            Quit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );

  // const GameScreen = () => {
  //   const concept = LEVEL_CONCEPTS[currentConcept];
  //   const usedNumbers = (userInput.match(/\d+/g) || []).flatMap(numStr => numStr.split('').map(Number));

  //   return (
  //     <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">
  //       <GameHeader />
  //       <div className="space-y-6">
  //         <Card className="p-4 sm:p-6">
  //           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
  //             <div>
  //               <h3 className="text-xl sm:text-2xl font-bold">{concept.name}</h3>
  //               <p className="text-sm text-gray-600 dark:text-gray-400">{concept.description}</p>
  //             </div>
  //             <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Level {currentLevel}</Badge>
  //           </div>
  //           <Timer initialTime={concept.timeLimit} onTimeOut={handleTimeOut} />
  //         </Card>

  //         <Card className="p-4 sm:p-6">
  //           <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
  //             <div>
  //               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Target Number</p>
  //               <p className="text-3xl sm:text-4xl font-bold text-blue-600">{target}</p>
  //             </div>
  //             <div className="text-right">
  //               <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Score</p>
  //               <p className="text-2xl sm:text-3xl font-bold">{score}</p>
  //             </div>
  //           </div>
  //           <NumberButtons numbers={numbers} usedNumbers={usedNumbers} insertAtCursor={insertAtCursor} />
  //         </Card>

  //         <Card className="p-4 sm:p-6">
  //           <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4">
  //             <input
  //               ref={inputRef}
  //               value={userInput}
  //               onChange={(e) => setUserInput(e.target.value)}
  //               onFocus={handleInputFocus}
  //               onBlur={handleInputBlur}
  //               placeholder="Enter your expression"
  //               className="flex-1 p-2 sm:p-3 border rounded-lg dark:bg-gray-700 dark:text-white text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
  //             />
  //             <p className="text-xl sm:text-2xl font-mono">=</p>
  //             <p className="text-xl sm:text-2xl font-bold w-20 sm:w-24 text-right">{liveResult}</p>
  //           </div>
  //           <OperationButtons availableOps={concept.operations} insertAtCursor={insertAtCursor} />
  //         </Card>

  //         <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
  //           <Button variant="outline" onClick={() => setUserInput('')}>
  //             <RefreshCw className="h-4 w-4 mr-2" />
  //             Clear
  //           </Button>
  //           <Button onClick={checkSolution}>
  //             <Check className="h-4 w-4 mr-2" />
  //             Submit
  //           </Button>
  //         </div>

  //         {message && (
  //           <Alert variant={message.includes('Excellent') ? 'success' : 'warning'}>
  //             {message}
  //           </Alert>
  //         )}
  //       </div>
  //     </div>
  //   );
  // };

  const GameScreen = () => {
    const concept = LEVEL_CONCEPTS[currentConcept];
    const usedNumbers = (userInput.match(/\d+/g) || []).flatMap(numStr => numStr.split('').map(Number));

    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => setUserInput(''),
      onSwipedRight: () => checkSolution(),
      trackTouch: true,
      delta: 50, // Minimum swipe distance
    });
  
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6" {...swipeHandlers}>
        <GameHeader />
        <div className="flex flex-col space-y-4 sm:space-y-6">
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold">{concept.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{concept.description}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 text-xs sm:text-sm">
                Level {currentLevel}
              </Badge>
            </div>
            <Timer initialTime={concept.timeLimit} onTimeOut={handleTimeOut} />
          </Card>
  
          <Card className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Target Number</p>
                <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-blue-600">{target}</p>
              </div>
              <div className="text-right">
                <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Score</p>
                <p className="text-xl sm:text-2xl md:text-3xl font-bold">{score}</p>
              </div>
            </div>
            <NumberButtons numbers={numbers} usedNumbers={usedNumbers} insertAtCursor={insertAtCursor} />
          </Card>
  
          <Card className="p-4 sm:p-6">
            <div className="flex items-center gap-2 sm:gap-4 mb-4">
              <input
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Enter your expression"
                className="flex-1 p-2 sm:p-3 border rounded-lg dark:bg-gray-700 dark:text-white text-base sm:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Expression input"
              />
              <p className="text-lg sm:text-xl md:text-2xl font-mono">=</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold w-16 sm:w-20 md:w-24 text-right">{liveResult}</p>
            </div>
            <OperationButtons availableOps={concept.operations} insertAtCursor={insertAtCursor} />
          </Card>
  
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
            <Button variant="outline" onClick={() => setUserInput('')}>
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Clear
            </Button>
            <Button onClick={checkSolution}>
              <Check className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
              Submit
            </Button>
          </div>
  
          {message && (
            <Alert variant={message.includes('Excellent') ? 'success' : 'warning'}>
              {message}
            </Alert>
          )}
        </div>
      </div>
    );
  };

  const SuccessScreen = () => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <GameHeader />
      <Card className="p-6 sm:p-8 text-center">
        <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4 animate-bounce" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Congratulations!</h2>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        <p className="text-sm sm:text-base">Your solution: {userInput}</p>
        <p className="text-sm sm:text-base">Correct solution: {solutions[0]}</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setGameState('MENU')}
          >
            Back to Menu
          </Button>
          <Button
            onClick={() => startGame(currentConcept)}
          >
            Play Again
          </Button>
        </div>
      </Card>
    </div>
  );

  const GameOverScreen = () => (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6 animate-fade-in">
      <GameHeader />
      <Card className="p-6 sm:p-8 text-center">
        <X className="h-16 w-16 mx-auto text-red-500 mb-4 animate-pulse" />
        <h2 className="text-2xl sm:text-3xl font-bold mb-2">Game Over</h2>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        <p className="text-sm sm:text-base">Your solution: {userInput || 'None'}</p>
        <p className="text-sm sm:text-base">Correct solution: {solutions[0]}</p>
        <div className="mt-6 flex flex-col sm:flex-row justify-center gap-4">
          <Button
            variant="outline"
            onClick={() => setGameState('MENU')}
          >
            Back to Menu
          </Button>
          <Button
            onClick={() => startGame(currentConcept)}
          >
            Try Again
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <>
      <Head>
        <title>Mathle - Math Puzzle Game</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
        <style jsx global>{`
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes scale-in {
            from { opacity: 0; transform: scale(0.95); }
            to { opacity: 1; transform: scale(1); }
          }
          @keyframes slide-up {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in {
            animation: fade-in 0.5s ease-out;
          }
          .animate-scale-in {
            animation: scale-in 0.3s ease-out;
          }
          .animate-slide-up {
            animation: slide-up 0.3s ease-out;
          }
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.2s;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            background: #2563eb;
          }
          input[type="range"]::-moz-range-thumb {
            width: 16px;
            height: 16px;
            background: #3b82f6;
            border-radius: 50%;
            cursor: pointer;
            transition: background 0.2s;
          }
          input[type="range"]::-moz-range-thumb:hover {
            background: #2563eb;
          }
        `}</style>
        {gameState === 'MENU' && <MenuScreen />}
        {gameState === 'PLAYING' && <GameScreen />}
        {gameState === 'SUCCESS' && <SuccessScreen />}
        {gameState === 'GAME_OVER' && <GameOverScreen />}
        <QuitDialog />
        <HelpDialog />
        <CustomLevelDialog />
        <HistoryDialog />
      </div>
    </>
  );
};

export default MathGame;


<style jsx global>{`
  @keyframes fade-in {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes scale-in {
    from { opacity: 0; transform: scale(0.95); }
    to { opacity: 1; transform: scale(1); }
  }
  @keyframes slide-up {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fade-in 0.5s ease-out;
  }
  .animate-scale-in {
    animation: scale-in 0.3s ease-out;
  }
  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
  /* Responsive font sizes */
  html {
    font-size: calc(14px + 0.5vw); /* Scales font size with viewport */
  }
  @media (max-width: 640px) {
    html {
      font-size: 16px; /* Fixed base size for small screens */
    }
  }
  @media (min-width: 1280px) {
    html {
      font-size: 18px; /* Larger base size for large screens */
    }
  }
  /* Touch-friendly button sizes */
  button {
    min-height: 44px;
    min-width: 44px;
    touch-action: manipulation; /* Prevents zoom on double-tap */
  }
  /* Range input styling */
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 20px;
    height: 20px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
  }
  input[type="range"]::-webkit-slider-thumb:hover {
    background: #2563eb;
  }
  input[type="range"]::-moz-range-thumb {
    width: 20px;
    height: 20px;
    background: #3b82f6;
    border-radius: 50%;
    cursor: pointer;
    transition: background 0.2s;
  }
  input[type="range"]::-moz-range-thumb:hover {
    background: #2563eb;
  }
  /* High contrast focus states */
  button:focus, input:focus {
    outline: 2px solid #3b82f6;
    outline-offset: 2px;
  }
  /* Smooth transitions for orientation changes */
  body {
    transition: all 0.3s ease;
  }
`}</style>