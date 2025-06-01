import React, { useState, useEffect, memo, useRef } from 'react';
import { evaluate } from 'mathjs';
import { Calculator, RefreshCw, Check, X, ArrowLeft, Trophy, HelpCircle, Settings, Share, Star, User, TrendingUp, History, Sliders } from 'lucide-react';

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
    targetRange: { min: 10, max: 50 },
    timeLimit: 120,
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
    targetRange: { min: 20, max: 100 },
    timeLimit: 150,
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
    targetRange: { min: 50, max: 200 },
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
    targetRange: { min: 100, max: 400 },
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
    targetRange: { min: 10, max: 500 },
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
  const { gamesPlayed, gamesWon, averageTime } = sessionStats;
  const winRate = gamesPlayed > 0 ? gamesWon / gamesPlayed : 0;
  
  let adjustment = { ...concept };
  
  // If winning too easily (>80% win rate), increase difficulty
  if (winRate > 0.8 && gamesPlayed >= 3) {
    adjustment.targetRange.max = Math.min(adjustment.targetRange.max * 1.2, 500);
    adjustment.timeLimit = Math.max(adjustment.timeLimit * 0.9, 60);
  }
  // If struggling (<30% win rate), decrease difficulty
  else if (winRate < 0.3 && gamesPlayed >= 3) {
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
    (op === '^' && rightResult.value <= 3) // Limit exponents
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
const NumberButtons = memo(({ numbers, usedNumbers, insertAtCursor }) => (
  <div className="space-y-4">
    <div>
      <p className="text-xs text-gray-500 mb-2">Available Numbers</p>
      <div className="grid grid-cols-3 gap-3">
        {numbers.map((num, i) => (
          <button
            key={i}
            onClick={() => !usedNumbers.includes(num) && insertAtCursor(num.toString())}
            className={`h-14 text-xl font-bold rounded-lg shadow-md transition-colors transform hover:scale-105 active:scale-95 ${
              usedNumbers.includes(num)
                ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                : 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800'
            }`}
            disabled={usedNumbers.includes(num)}
          >
            {num}
          </button>
        ))}
      </div>
    </div>
  </div>
));

const OperationButtons = memo(({ availableOps, insertAtCursor }) => {
  const basicOps = availableOps.filter(op => ['+', '-', '*', '/', '^', '(', ')'].includes(op));
  const advancedOps = [
    { symbol: '!', display: 'n!', title: 'Factorial', available: availableOps.includes('!') },
    { symbol: 'sqrt(', display: '√', title: 'Square Root', available: availableOps.includes('sqrt(') },
    { symbol: 'cbrt(', display: '∛', title: 'Cube Root', available: availableOps.includes('cbrt(') },
  ].filter(op => op.available);

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-500 mb-2">Basic Operations</p>
        <div className="grid grid-cols-3 gap-3">
          {[...basicOps, '(', ')'].map((op) => (
            <button
              key={op}
              onClick={() => insertAtCursor(` ${op} `)}
              className="h-14 text-xl font-mono bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors transform hover:scale-105 active:scale-95"
            >
              {op}
            </button>
          ))}
        </div>
      </div>
      
      {advancedOps.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Advanced Functions</p>
          <div className="grid grid-cols-2 gap-2">
            {advancedOps.map((func) => (
              <button
                key={func.symbol}
                onClick={() => insertAtCursor(func.symbol)}
                className="h-10 text-sm font-mono bg-purple-100 dark:bg-purple-900 rounded-lg shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors transform hover:scale-105 active:scale-95"
                title={func.title}
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
    mustUseAll: false
  });
  const [numbers, setNumbers] = useState([]);
  const [target, setTarget] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [liveResult, setLiveResult] = useState('--');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [solutions, setSolutions] = useState([]);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [showHistoryDialog, setShowHistoryDialog] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  
  // Session and overall statistics
  const [sessionStats, setSessionStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalTime: 0,
    averageTime: 0,
    currentStreak: 0,
    history: []
  });
  
  const [overallStats, setOverallStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    winRate: 0,
    highScore: 0,
    longestStreak: 0,
    levelProgress: {}
  });
  
  const inputRef = useRef(null);

  // Insert text at cursor position
  const insertAtCursor = (text) => {
    const input = inputRef.current;
    if (!input) return;
    
    const start = input.selectionStart;
    const end = input.selectionEnd;
    const newValue = userInput.substring(0, start) + text + userInput.substring(end);
    
    setUserInput(newValue);
    
    setTimeout(() => {
      const newCursorPos = start + text.length;
      input.setSelectionRange(newCursorPos, newCursorPos);
      input.focus();
    }, 0);
  };

  // Live calculation effect
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

  // Update statistics
  const updateStats = (won, scoreToAdd = 0, timeTaken = 0, problemData = null) => {
    // Update session stats
    setSessionStats(prev => {
      const newHistory = problemData ? [...prev.history, problemData] : prev.history;
      return {
        gamesPlayed: prev.gamesPlayed + 1,
        gamesWon: won ? prev.gamesWon + 1 : prev.gamesWon,
        totalTime: prev.totalTime + timeTaken,
        averageTime: (prev.totalTime + timeTaken) / (prev.gamesPlayed + 1),
        currentStreak: won ? prev.currentStreak + 1 : 0,
        history: newHistory
      };
    });

    // Update overall stats
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
          [currentConcept]: (prev.levelProgress[currentConcept] || 0) + (won ? 1 : 0)
        }
      };
    });
  };

  // Start game with selected concept
  const startGame = (conceptKey, isCustom = false) => {
    let concept = isCustom ? {
      ...LEVEL_CONCEPTS.CUSTOM,
      targetRange: { min: customSettings.minTarget, max: customSettings.maxTarget },
      timeLimit: customSettings.timeLimit,
      operations: customSettings.operations,
      mustUseAll: customSettings.mustUseAll
    } : LEVEL_CONCEPTS[conceptKey];
    
    // Apply progressive difficulty
    if (!isCustom) {
      concept = adjustDifficultyForSession(concept, sessionStats);
    }
    
    let solution, targetValue, gameNumbers;
    const numberCount = isCustom ? customSettings.numberCount : 
      Math.floor(Math.random() * (concept.maxNumbers - concept.minNumbers + 1)) + concept.minNumbers;
    
    // Generate valid puzzle
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
    setTimeLeft(concept.timeLimit);
    setGameState('PLAYING');
    setUserInput('');
    setLiveResult('--');
    setMessage('');
  };

  // Check solution
  const checkSolution = () => {
    if (!userInput.trim()) return setMessage('Please enter a solution');
    
    const concept = LEVEL_CONCEPTS[currentConcept];
    const numberMatches = userInput.match(/\d+/g) || [];
    const usedDigits = [];
    
    // Validate number usage
    for (const numStr of numberMatches) {
      const digits = numStr.split('').map(d => parseInt(d));
      for (const digit of digits) {
        if (!numbers.includes(digit)) {
          return setMessage(`Digit ${digit} not available in provided numbers`);
        }
        usedDigits.push(digit);
      }
    }
    
    // Check digit usage counts
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
    
    // Check if must use all numbers
    if (concept.mustUseAll && usedDigits.length !== numbers.length) {
      return setMessage('You must use ALL numbers for this level!');
    }
    
    try {
      const result = evaluateExpression(userInput);
      const timeTaken = concept.timeLimit - timeLeft;
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
        timestamp: new Date().toISOString()
      };
      
      if (scoreToAdd > 0) {
        setScore(scoreToAdd);
        setGameState('SUCCESS');
        setMessage(`Excellent! Earned ${scoreToAdd} points!`);
        
        // Level progression
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

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      const timeTaken = LEVEL_CONCEPTS[currentConcept].timeLimit;
      const problemData = {
        target,
        numbers: [...numbers],
        userSolution: userInput,
        correctSolution: solutions[0],
        solved: false,
        score: 0,
        timeTaken,
        concept: currentConcept,
        timestamp: new Date().toISOString()
      };
      
      setGameState('GAME_OVER');
      setMessage('Time\'s up!');
      updateStats(false, 0, timeTaken, problemData);
    }
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  // Progress bar component
  const ProgressBar = ({ value, className = "" }) => (
    <div className={`w-full bg-gray-200 rounded-full h-2 ${className}`}>
      <div 
        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );

  // Badge component
  const Badge = ({ children, className = "" }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {children}
    </span>
  );

  // Card component
  const Card = ({ children, className = "" }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-md ${className}`}>
      {children}
    </div>
  );

  // Button component
  const Button = ({ children, onClick, disabled, variant = "default", size = "default", className = "" }) => {
    const baseClasses = "inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
    const variantClasses = {
      default: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
      outline: "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500",
      ghost: "text-gray-700 hover:bg-gray-100 focus:ring-blue-500"
    };
    const sizeClasses = {
      default: "h-10 py-2 px-4",
      sm: "h-8 px-3 text-sm",
      lg: "h-12 px-8",
      icon: "h-10 w-10"
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

  // Alert component
  const Alert = ({ children, variant = "default", className = "" }) => {
    const variantClasses = {
      default: "bg-blue-50 border-blue-200 text-blue-800",
      info: "bg-blue-50 border-blue-200 text-blue-800",
      success: "bg-green-50 border-green-200 text-green-800",
      warning: "bg-yellow-50 border-yellow-200 text-yellow-800",
      destructive: "bg-red-50 border-red-200 text-red-800"
    };
    
    return (
      <div className={`rounded-lg border p-4 ${variantClasses[variant]} ${className}`}>
        {children}
      </div>
    );
  };

  // Dialog components
  const Dialog = ({ open, onOpenChange, children }) => {
    if (!open) return null;
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange(false)} />
        <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
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
    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
      {children}
    </h2>
  );

  const DialogDescription = ({ children }) => (
    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
      {children}
    </p>
  );

  // Game Header Component
  const GameHeader = () => (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setShowQuitDialog(true)} className="text-white hover:bg-blue-700">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="text-center">
          <h1 className="text-2xl font-extrabold tracking-wide">MATHLE</h1>
          {currentConcept && (
            <p className="text-sm opacity-90">
              Level {currentLevel} • {LEVEL_CONCEPTS[currentConcept].scientist}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowHistoryDialog(true)} className="text-white hover:bg-blue-700">
            <History className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setShowHelpDialog(true)} className="text-white hover:bg-blue-700">
            <HelpCircle className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );

  // Menu Screen Component
  const MenuScreen = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 animate-fade-in">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
          Welcome to Mathle
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Master mathematics with legendary scientists • Level {currentLevel}
        </p>
      </div>

      {/* Session Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Session Streak", value: sessionStats.currentStreak, icon: "🔥" },
          { label: "Session Games", value: `${sessionStats.gamesWon}/${sessionStats.gamesPlayed}`, icon: "🎯" },
          { label: "Total Score", value: overallStats.totalScore, icon: "🏆" },
          { label: "Win Rate", value: `${overallStats.winRate}%`, icon: "📊" },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center transform hover:scale-105 transition-transform"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Level Selection */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Choose Your Scientist</h3>
          <Button 
            variant="outline" 
            onClick={() => setShowCustomDialog(true)}
            className="flex items-center gap-2"
          >
            <Sliders className="h-4 w-4" />
            Custom Level
          </Button>
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
                className={`p-4 rounded-xl shadow-md transition-all text-left transform hover:scale-105 ${
                  isUnlocked 
                    ? 'bg-white dark:bg-gray-800 hover:shadow-lg cursor-pointer' 
                    : 'bg-gray-200 dark:bg-gray-700 cursor-not-allowed opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl">{concept.icon}</span>
                  {!isUnlocked && <span className="text-xs bg-gray-400 text-white px-2 py-1 rounded">🔒</span>}
                </div>
                <h4 className="font-bold text-lg">{concept.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{concept.scientist}</p>
                <p className="text-xs text-gray-500">{concept.description}</p>
                <div className="mt-2">
                <ProgressBar value={(progress / 3) * 100} className="mt-2" />
                  <p className="text-xs text-gray-500 mt-1">
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

  // Custom Level Dialog
  const CustomLevelDialog = () => (
    <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom Challenge Setup</DialogTitle>
          <DialogDescription>Create your own math puzzle</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Number of Numbers ({customSettings.numberCount})
            </label>
            <input
              type="range"
              min="3"
              max="6"
              value={customSettings.numberCount}
              onChange={(e) => setCustomSettings({ ...customSettings, numberCount: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Target Range ({customSettings.minTarget} - {customSettings.maxTarget})
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="100"
                value={customSettings.minTarget}
                onChange={(e) => setCustomSettings({ ...customSettings, minTarget: parseInt(e.target.value) })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
              <input
                type="number"
                min={customSettings.minTarget}
                max="500"
                value={customSettings.maxTarget}
                onChange={(e) => setCustomSettings({ ...customSettings, maxTarget: parseInt(e.target.value) })}
                className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Time Limit ({customSettings.timeLimit}s)
            </label>
            <input
              type="range"
              min="60"
              max="300"
              step="10"
              value={customSettings.timeLimit}
              onChange={(e) => setCustomSettings({ ...customSettings, timeLimit: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                    className="h-4 w-4"
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
                className="h-4 w-4"
              />
              Must Use All Numbers
            </label>
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-2">
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

  // History Dialog
  const HistoryDialog = () => (
    <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Game History</DialogTitle>
          <DialogDescription>Your session performance</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {sessionStats.history.length === 0 ? (
            <p className="text-gray-500">No games played in this session.</p>
          ) : (
            sessionStats.history.map((game, i) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">
                      {LEVEL_CONCEPTS[game.concept].name} • {game.timestamp.slice(0, 10)}
                    </p>
                    <p className="text-sm text-gray-600">
                      Target: {game.target} | Numbers: {game.numbers.join(', ')}
                    </p>
                    <p className="text-sm">
                      Your Solution: {game.userSolution || 'None'}
                    </p>
                    <p className="text-sm text-gray-600">
                      Correct Solution: {game.correctSolution}
                    </p>
                  </div>
                  <Badge className={game.solved ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
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

  // Help Dialog
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

  // Quit Confirmation Dialog
  const QuitDialog = () => (
    <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quit Game?</DialogTitle>
          <DialogDescription>Are you sure you want to return to the menu? Your current progress will be saved.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-end gap-2">
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

  // Game Screen Component
  const GameScreen = () => {
    const concept = LEVEL_CONCEPTS[currentConcept];
    const usedNumbers = (userInput.match(/\d+/g) || []).flatMap(numStr => numStr.split('').map(Number));

    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <GameHeader />
        <div className="space-y-6">
          {/* Game Info */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-xl font-bold">{concept.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{concept.description}</p>
              </div>
              <Badge className="bg-blue-100 text-blue-800">Level {currentLevel}</Badge>
            </div>
            <ProgressBar value={(timeLeft / concept.timeLimit) * 100} />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
          </Card>

          {/* Target and Numbers */}
          <Card className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Target Number</p>
                <p className="text-4xl font-bold text-blue-600">{target}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                <p className="text-2xl font-bold">{score}</p>
              </div>
            </div>
            <NumberButtons numbers={numbers} usedNumbers={usedNumbers} insertAtCursor={insertAtCursor} />
          </Card>

          {/* Input and Operations */}
          <Card className="p-6">
            <div className="flex items-center gap-4 mb-4">
              <input
                ref={inputRef}
                value={userInput}
                onChange={(e) => setUserInput(e.target.value)}
                placeholder="Enter your expression"
                className="flex-1 p-2 border rounded dark:bg-gray-700 dark:text-white text-lg"
              />
              <p className="text-xl font-mono">=</p>
              <p className="text-xl font-bold w-20 text-right">
                {liveResult}
              </p>
            </div>
            <OperationButtons availableOps={concept.operations} insertAtCursor={insertAtCursor} />
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={() => setUserInput('')}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Clear
            </Button>
            <Button onClick={checkSolution}>
              <Check className="h-4 w-4 mr-2" />
              Submit
            </Button>
          </div>

          {/* Message */}
          {message && (
            <Alert variant={message.includes('Excellent') ? 'success' : 'warning'}>
              {message}
            </Alert>
          )}
        </div>
      </div>
    );
  };

  // Success Screen Component
  const SuccessScreen = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <GameHeader />
      <Card className="p-6 text-center">
        <Trophy className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Congratulations!</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        <p className="text-sm">Your solution: {userInput}</p>
        <p className="text-sm">Correct solution: {solutions[0]}</p>
        <div className="mt-6 flex justify-center gap-4">
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

  // Game Over Screen Component
  const GameOverScreen = () => (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-fade-in">
      <GameHeader />
      <Card className="p-6 text-center">
        <X className="h-16 w-16 mx-auto text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Game Over</h2>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">{message}</p>
        <p className="text-sm">Your solution: {userInput || 'None'}</p>
        <p className="text-sm">Correct solution: {solutions[0]}</p>
        <div className="mt-6 flex justify-center gap-4">
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

  // Main Render
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors">
      {gameState === 'MENU' && <MenuScreen />}
      {gameState === 'PLAYING' && <GameScreen />}
      {gameState === 'SUCCESS' && <SuccessScreen />}
      {gameState === 'GAME_OVER' && <GameOverScreen />}
      <QuitDialog />
      <HelpDialog />
      <CustomLevelDialog />
      <HistoryDialog />
    </div>
  );
};

export default MathGame;
                
                