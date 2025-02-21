import React, { useState, useEffect, memo } from 'react';
import { evaluate } from 'mathjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, RefreshCw, Check, X, ArrowLeft, Trophy, HelpCircle, Settings, Share } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

// Difficulty configurations
const DIFFICULTY_CONFIGS = {
  BEGINNER: { numberCount: 5, timeLimit: 120, baseScore: 100, description: "Combine numbers creatively" },
  INTERMEDIATE: { numberCount: 6, timeLimit: 180, baseScore: 200, description: "More numbers, more possibilities" },
  ADVANCED: { numberCount: 4, timeLimit: 240, baseScore: 300, description: "Complex combinations" },
};

// Generate unique random integers between 0 and 10
const generateUniqueNumbers = (count) => {
  const numbers = new Set();
  while (numbers.size < count) {
    numbers.add(Math.floor(Math.random() * 11));
  }
  return Array.from(numbers);
};

// Generate a random integer expression using all numbers, including exponents
const generateRandomExpression = (numbers) => {
  if (numbers.length === 1) return { expr: numbers[0].toString(), value: numbers[0] };
  const index = Math.floor(Math.random() * (numbers.length - 1)) + 1;
  const left = numbers.slice(0, index);
  const right = numbers.slice(index);
  const leftResult = generateRandomExpression(left);
  const rightResult = generateRandomExpression(right);
  const operations = ['+', '-', '*', '/', '**'];
  if (rightResult.value === 0 && operations.includes('/')) operations.splice(operations.indexOf('/'), 1);
  const op = operations[Math.floor(Math.random() * operations.length)];
  let value;
  if (op === '+') value = leftResult.value + rightResult.value;
  else if (op === '-') value = leftResult.value - rightResult.value;
  else if (op === '*') value = leftResult.value * rightResult.value;
  else if (op === '/') value = leftResult.value / rightResult.value;
  else if (op === '**') value = Math.pow(leftResult.value, rightResult.value);
  const expr = `(${leftResult.expr} ${op === '**' ? '^' : op} ${rightResult.expr})`;
  return { expr, value };
};

// Memoized sub-components
const NumberButtons = memo(({ numbers, usedNumbers, setUserInput, userInput }) => (
  <div className="grid grid-cols-3 gap-3">
    {numbers.map((num, i) => (
      <motion.button
        key={i}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => !usedNumbers.includes(num) && setUserInput(userInput + num)}
        className={`h-14 text-xl font-bold rounded-lg shadow-md transition-colors ${
          usedNumbers.includes(num)
            ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
            : 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800'
        }`}
        disabled={usedNumbers.includes(num)}
      >
        {num}
      </motion.button>
    ))}
  </div>
));

const OperationButtons = memo(({ setUserInput, userInput }) => (
  <div className="grid grid-cols-3 gap-3">
    {['+', '-', '*', '/', '^', '(', ')'].map((op) => (
      <motion.button
        key={op}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setUserInput(userInput + ` ${op} `)}
        className="h-14 text-xl font-mono bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
      >
        {op}
      </motion.button>
    ))}
  </div>
));

const MathGame = () => {
  const [gameState, setGameState] = useState('MENU');
  const [difficulty, setDifficulty] = useState(null);
  const [numbers, setNumbers] = useState([]);
  const [target, setTarget] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [liveResult, setLiveResult] = useState('--'); // New state for live calculation
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [solutions, setSolutions] = useState([]);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    winRate: 0,
    highScore: 0,
    streak: 0,
  });

  useEffect(() => {
    const savedStats = localStorage.getItem('mathGameStats');
    if (savedStats) setStats(JSON.parse(savedStats));
  }, []);

  useEffect(() => {
    localStorage.setItem('mathGameStats', JSON.stringify(stats));
  }, [stats]);

  // Live calculation effect
  useEffect(() => {
    if (!userInput.trim()) {
      setLiveResult('--');
      return;
    }
    try {
      const result = evaluate(userInput);
      setLiveResult(Number.isInteger(result) ? result : result.toFixed(2)); // Show integer or 2 decimal places
    } catch {
      setLiveResult('Invalid');
    }
  }, [userInput]);

  const updateStats = (won, scoreToAdd = 0) => {
    setStats((prev) => {
      const gamesPlayed = prev.gamesPlayed + 1;
      const gamesWon = won ? prev.gamesWon + 1 : prev.gamesWon;
      return {
        gamesPlayed,
        gamesWon,
        totalScore: prev.totalScore + scoreToAdd,
        highScore: Math.max(prev.highScore, scoreToAdd),
        streak: won ? prev.streak + 1 : 0,
        winRate: ((gamesWon / gamesPlayed) * 100).toFixed(1),
      };
    });
  };

  const startGame = (selectedDifficulty) => {
    const config = DIFFICULTY_CONFIGS[selectedDifficulty];
    const numbers = generateUniqueNumbers(config.numberCount);
    let solution;
    do {
      solution = generateRandomExpression(numbers);
    } while (!Number.isInteger(solution.value) || isNaN(solution.value) || !isFinite(solution.value) || solution.value > 10000 || solution.value < -10000);
    setDifficulty(selectedDifficulty);
    setNumbers(numbers);
    setTarget(solution.value);
    setSolutions([solution.expr]);
    setTimeLeft(config.timeLimit);
    setGameState('PLAYING');
    setUserInput('');
    setLiveResult('--');
    setMessage('');
    updateStats(false);
  };

  const checkSolution = () => {
    if (!userInput.trim()) return setMessage('Please enter a solution');
    const cleaned = userInput.replace(/[\d+\+\-\*\/\^\(\)\s]/g, '');
    if (cleaned !== '') return setMessage('Invalid characters in expression');
    const usedNumbers = userInput.match(/\d+/g)?.map(Number) || [];
    if (usedNumbers.some(num => !numbers.includes(num))) return setMessage('Used numbers not provided');
    if (new Set(usedNumbers).size !== usedNumbers.length) return setMessage('Cannot use a number more than once');
    try {
      const result = evaluate(userInput);
      const config = DIFFICULTY_CONFIGS[difficulty];
      const timeBonus = Math.floor(timeLeft * (config.baseScore / config.timeLimit));
      const scoreToAdd = Math.abs(result - target) < 1e-9 ? config.baseScore + timeBonus : 0;
      if (scoreToAdd > 0) {
        setScore(scoreToAdd);
        setStats(prev => ({ ...prev, totalScore: prev.totalScore + scoreToAdd }));
        setGameState('SUCCESS');
        updateStats(true, scoreToAdd);
        setMessage(`Correct! Earned ${scoreToAdd} points!`);
      } else {
        setMessage('Incorrect solution. Try again!');
      }
    } catch (error) {
      setMessage('Invalid expression: ' + error.message);
    }
  };

  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      setGameState('GAME_OVER');
      setMessage('Time’s up!');
    }
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const GameHeader = () => (
    <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 shadow-lg">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setShowQuitDialog(true)} className="text-white hover:bg-blue-700">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-2xl font-extrabold tracking-wide">MATHLE</h1>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => setShowHelpDialog(true)} className="text-white hover:bg-blue-700">
            <HelpCircle className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );

  const MenuScreen = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-2xl mx-auto px-4 py-12 text-center space-y-10"
    >
      <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
        Welcome to Mathle
      </h2>
      <p className="text-lg text-gray-600 dark:text-gray-300">Solve daily math puzzles with a twist!</p>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: Trophy, label: "Total Score", value: stats.totalScore, desc: "All-time points" },
          { icon: Calculator, label: "Games Won", value: stats.gamesWon, desc: `${stats.gamesPlayed} played` },
          { icon: RefreshCw, label: "Win Rate", value: `${stats.winRate}%`, desc: `${stats.streak} streak` },
        ].map((stat, i) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md"
          >
            <stat.icon className="h-6 w-6 text-blue-500 mx-auto" />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{stat.label}</p>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-xs text-gray-400">{stat.desc}</p>
          </motion.div>
        ))}
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Choose Your Challenge</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          {Object.entries(DIFFICULTY_CONFIGS).map(([key, config]) => (
            <motion.button
              key={key}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => startGame(key)}
              className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="text-left">
                <p className="font-bold text-lg text-gray-800 dark:text-gray-200">
                  {key.charAt(0) + key.slice(1).toLowerCase()}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{config.description}</p>
              </div>
              <Badge className="mt-2 bg-blue-500">{config.baseScore} pts</Badge>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );

  const GameScreen = () => {
    const usedNumbers = userInput.match(/\d+/g)?.map(Number) || [];
    const isCorrect = liveResult !== 'Invalid' && liveResult !== '--' && Math.abs(liveResult - target) < 1e-9;
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
        <div className="flex justify-between items-center">
          <div className="text-center">
            <motion.h2
              initial={{ scale: 1 }}
              animate={{ scale: timeLeft < 30 ? [1, 1.05, 1] : 1 }}
              transition={{ duration: 1, repeat: timeLeft < 30 ? Infinity : 0 }}
              className="text-4xl font-bold text-blue-600"
            >
              {Math.round(target)}
            </motion.h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">Target</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200">
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Time Left</p>
          </div>
        </div>
        <Progress
          value={(timeLeft / DIFFICULTY_CONFIGS[difficulty].timeLimit) * 100}
          className={`h-2 ${timeLeft < 30 ? 'bg-red-500' : 'bg-blue-500'}`}
        />
        <div className="space-y-2">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full p-4 text-xl font-mono border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            placeholder="Your solution..."
            onKeyDown={(e) => e.key === 'Enter' && checkSolution()}
          />
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className={`text-center text-lg font-mono ${isCorrect ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}
          >
            = {liveResult}
          </motion.div>
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Numbers</p>
            <NumberButtons numbers={numbers} usedNumbers={usedNumbers} setUserInput={setUserInput} userInput={userInput} />
          </div>
          <div className="space-y-4">
            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Operations</p>
            <OperationButtons setUserInput={setUserInput} userInput={userInput} />
          </div>
        </div>
        <div className="flex gap-4 justify-center">
          <Button
            onClick={checkSolution}
            className="flex-1 h-12 bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
          >
            <Check className="w-5 h-5 mr-2" /> Check
          </Button>
          <Button
            onClick={() => setMessage(solutions[0])}
            className="flex-1 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
          >
            <HelpCircle className="w-5 h-5 mr-2" /> Hint
          </Button>
          <Button
            onClick={() => setUserInput('')}
            variant="outline"
            className="h-12 px-6 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4"
            >
              <Alert className={message.includes('Correct') ? 'bg-green-100' : 'bg-red-100'}>
                <AlertDescription className="text-center">{message}</AlertDescription>
              </Alert>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const ResultScreen = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto px-4 py-12"
    >
      <Card className="p-6 text-center space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
        <motion.h3
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 1, repeat: gameState === 'SUCCESS' ? 2 : 0 }}
          className={`text-3xl font-bold ${gameState === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}
        >
          {gameState === 'SUCCESS' ? '🎉 Brilliant!' : '⏰ Time’s Up!'}
        </motion.h3>
        <p className="text-gray-600 dark:text-gray-300">
          {gameState === 'SUCCESS' ? `Solved with ${timeLeft}s left!` : 'Better luck next time!'}
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{score}</p>
            <p className="text-sm text-gray-500">Round Score</p>
          </div>
          <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{stats.totalScore}</p>
            <p className="text-sm text-gray-500">Total Score</p>
          </div>
        </div>
        {solutions.length > 0 && (
          <Card className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Example Solution</p>
            <p className="text-lg font-mono text-gray-600 dark:text-gray-300">{solutions[0]}</p>
          </Card>
        )}
        <div className="flex flex-col gap-3">
          <Button onClick={() => startGame(difficulty)} className="h-12 bg-blue-500 hover:bg-blue-600">
            <RefreshCw className="w-5 h-5 mr-2" /> Play Again
          </Button>
          <Button
            variant="outline"
            onClick={() => setGameState('MENU')}
            className="h-12 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Change Difficulty
          </Button>
          <Button variant="secondary" className="h-12 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">
            <Share className="w-5 h-5 mr-2" /> Share Score
          </Button>
        </div>
      </Card>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-blue-900">
      <GameHeader />
      <AnimatePresence mode="wait">
        {gameState === 'MENU' && <MenuScreen key="menu" />}
        {gameState === 'PLAYING' && <GameScreen key="game" />}
        {(gameState === 'SUCCESS' || gameState === 'GAME_OVER') && <ResultScreen key="result" />}
      </AnimatePresence>

      <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>Quit Game?</DialogTitle>
            <DialogDescription>Are you sure? Your progress will be lost.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowQuitDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={() => { setShowQuitDialog(false); setGameState('MENU'); setScore(0); }}>
              Quit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent className="rounded-xl">
          <DialogHeader>
            <DialogTitle>How to Play</DialogTitle>
            <DialogDescription className="space-y-4">
              <p>Use any subset of the given numbers with +, -, *, /, or ^ (exponents) to match the target.</p>
              <ul className="list-disc pl-4 space-y-2">
                <li>Each number can be used at most once</li>
                <li>Use proper notation with parentheses if needed</li>
                <li>Solve within the time limit for points</li>
                <li>Faster solutions = more points</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowHelpDialog(false)} className="bg-blue-500 hover:bg-blue-600">
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MathGame;