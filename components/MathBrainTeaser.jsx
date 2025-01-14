import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Clock, Calculator, Check, X,
  Users, Book, RefreshCw, ArrowRight,
  ChevronRight, Menu, ArrowLeftCircle, 
  Lightbulb,
  Award
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";


// Constants
const DIFFICULTY_LEVELS = {
  BEGINNER: {
    name: 'Beginner',
    numberCount: 3,
    maxNumber: 9,
    operations: ['+', '-', '*', '/'],
    timeLimit: 60,
    baseScore: 50,
    explanation: 'Simple calculations with basic operations',
    required: { level: 0, achievements: 0 },
    complexity: 1 // Controls how complex the generated solutions will be
  },
  EASY: {
    name: 'Easy',
    numberCount: 4,
    maxNumber: 9,
    operations: ['+', '-', '*', '/', 'sqrt', 'pow'],
    timeLimit: 120,
    baseScore: 100,
    explanation: 'More numbers, moderate complexity',
    required: { level: 5, achievements: 1 },
    complexity: 2
  },
  MEDIUM: {
    name: 'Medium',
    numberCount: 5,
    maxNumber: 9,
    operations: ['+', '-', '*', '/', 'sqrt', 'pow'],
    timeLimit: 180,
    baseScore: 200,
    explanation: 'Complex calculations with multiple steps',
    required: { level: 10, achievements: 2 },
    complexity: 3
  },
  HARD: {
    name: 'Hard',
    numberCount: 6,
    maxNumber: 9,
    operations: ['+', '-', '*', '/', 'sqrt', 'pow'],
    timeLimit: 240,
    baseScore: 300,
    explanation: 'Advanced calculations requiring multiple operations',
    required: { level: 15, achievements: 3 },
    complexity: 4
  },
  EXPERT: {
    name: 'Expert',
    numberCount: 7,
    maxNumber: 9,
    operations: ['+', '-', '*', '/', 'sqrt', 'pow'],
    timeLimit: 300,
    baseScore: 500,
    explanation: 'Master-level puzzles with intricate solutions',
    required: { level: 20, achievements: 4 },
    complexity: 5
  }
};

const ACHIEVEMENTS = {
  FIRST_WIN: {
    name: 'First Steps',
    description: 'Complete your first puzzle',
    icon: '🎯',
    requirement: (stats) => stats.gamesWon >= 1
  },
  SPEED_DEMON: {
    name: 'Speed Demon',
    description: 'Solve with >50% time remaining',
    icon: '⚡',
    requirement: (stats, timeLeft, timeLimit) => timeLeft > timeLimit / 2
  },
  PERFECT_STREAK: {
    name: 'Perfect Streak',
    description: 'Win 3 games in a row',
    icon: '🎯',
    requirement: (stats) => stats.currentStreak >= 3
  },
  MATH_WIZARD: {
    name: 'Math Wizard',
    description: 'Solve Hard without hints',
    icon: '🧙‍♂️',
    requirement: (stats, _, __, difficulty, hintsUsed) =>
      difficulty === 'HARD' && hintsUsed === 0
  },
  EXPLORER: {
    name: 'Explorer',
    description: 'Try all basic difficulties',
    icon: '🌟',
    requirement: (stats) =>
      Object.keys(stats.difficultyPlayed).length >= 3
  },
  GRANDMASTER: {
    name: 'Grandmaster',
    description: 'Win 50 total games',
    icon: '👑',
    requirement: (stats) => stats.gamesWon >= 50
  }
};

const TUTORIAL_STEPS = [
  {
    title: 'Welcome to Math Brain Teaser!',
    content: 'Train your brain with fun math puzzles. Progress through difficulties and compete with friends!'
  },
  {
    title: 'How to Play',
    content: 'Use the given numbers and operations to reach the target number. Each number can only be used once.'
  },
  {
    title: 'Scoring & Progress',
    content: 'Earn points based on difficulty and speed. Unlock new levels and achievements as you improve!'
  },
  {
    title: 'Multiplayer',
    content: 'Challenge friends in real-time matches or compete on the global leaderboard.'
  }
];

// Types (for TypeScript support)
/**
 * @typedef {Object} GameStats
 * @property {number} gamesPlayed
 * @property {number} gamesWon
 * @property {number} currentStreak
 * @property {number} bestStreak
 * @property {Object} difficultyPlayed
 * @property {number} totalScore
 * @property {number} level
 * @property {string[]} achievements
 */

/**
 * @typedef {Object} MultiplayerGame
 * @property {string} id
 * @property {Object} players
 * @property {string} status
 * @property {Object} puzzle
 * @property {Object} scores
 */

const MathBrainTeaser = () => {
  // Game State

  const bypassLocks = true; 
  const [gameState, setGameState] = useState('SELECT_LEVEL'); // SELECT_LEVEL, PLAYING, SUCCESS, GAME_OVER
  const [difficulty, setDifficulty] = useState(null);
  const [numbers, setNumbers] = useState([]);
  const [targetNumber, setTargetNumber] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [hint, setHint] = useState('');
  const [hintsRemaining, setHintsRemaining] = useState(3);
  const [hintsUsed, setHintsUsed] = useState(0);

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(0);

  // Progress State
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    currentStreak: 0,
    bestStreak: 0,
    difficultyPlayed: {},
    totalScore: 0,
    level: 0,
    achievements: []
  });

  // Multiplayer State
  const [multiplayerMode, setMultiplayerMode] = useState(false);
  const [multiplayerGame, setMultiplayerGame] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  // Animation State
  const [showAchievement, setShowAchievement] = useState(null);
  const [levelUpAnimation, setLevelUpAnimation] = useState(false);

  // Effects
  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      handleGameOver();
    }
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  // Game Logic


  // Modified number generation function
  const generateUniqueNumbers = (count, maxNumber = 9) => {
    const numbers = [];
    const available = Array.from({ length: maxNumber }, (_, i) => i + 1);

    while (numbers.length < count && available.length > 0) {
      const randomIndex = Math.floor(Math.random() * available.length);
      numbers.push(available[randomIndex]);
      available.splice(randomIndex, 1);
    }
    console.log(numbers);
    return numbers;
  };

  // Modified target number generation based on difficulty complexity
  const generateTargetNumber = (nums, ops, complexity) => {
    const operations = [...ops];
    let numbers = [...nums];
    let solution = '';
    let result = numbers[0];
    solution = `${numbers[0]}`;

    // Use more operations for higher complexity levels
    const minOperations = Math.min(complexity + 1, numbers.length - 1);
    const maxOperations = Math.min(complexity + 2, numbers.length);
    const operationCount = Math.floor(Math.random() * (maxOperations - minOperations + 1)) + minOperations;

    for (let i = 0; i < operationCount; i++) {
      const op = operations[Math.floor(Math.random() * operations.length)];
      const nextNumIndex = Math.floor(Math.random() * (numbers.length - 1)) + 1;
      const nextNum = numbers[nextNumIndex];
      numbers.splice(nextNumIndex, 1);

      // Make calculations more complex at higher difficulties
      switch (op) {
        case '+':
          result += nextNum;
          solution += ` + ${nextNum}`;
          break;
        case '*':
          // Prefer multiplication at higher difficulties
          if (complexity > 2 && Math.random() < 0.7) {
            result *= nextNum;
            solution += ` * ${nextNum}`;
          } else {
            result += nextNum;
            solution += ` + ${nextNum}`;
          }
          break;
        case '-':
          // Ensure no negative numbers
          if (result > nextNum) {
            result -= nextNum;
            solution += ` - ${nextNum}`;
          } else {
            result += nextNum;
            solution += ` + ${nextNum}`;
          }
          break;
        case '/':
          // Only allow clean division
          if (result % nextNum === 0 && nextNum !== 1) {
            result /= nextNum;
            solution += ` / ${nextNum}`;
          } else {
            result *= nextNum;
            solution += ` * ${nextNum}`;
          }
          break;
        case 'sqrt':
          // Only use square root for perfect squares at higher difficulties
          if (complexity > 3 && Number.isInteger(Math.sqrt(nextNum))) {
            result *= Math.sqrt(nextNum);
            solution += ` * sqrt(${nextNum})`;
          } else {
            result += nextNum;
            solution += ` + ${nextNum}`;
          }
          break;
        case 'pow':
          // Only use small powers to keep numbers manageable
          if (complexity > 3 && nextNum <= 2) {
            result = Math.pow(result, nextNum);
            solution += ` ^ ${nextNum}`;
          } else {
            result += nextNum;
            solution += ` + ${nextNum}`;
          }
          break;
      }
    }

    return {
      target: result,
      solution: solution,
      usedNumbers: nums
    };
  };

  // Update the startGame function to use the new logic
  const startGame = async (level) => {
    const config = DIFFICULTY_LEVELS[level];
    const newNumbers = generateUniqueNumbers(config.numberCount);
    let puzzleData;

    // Wait until puzzleData is generated
    while (!puzzleData || isNaN(puzzleData.target)) {
      puzzleData = generateTargetNumber(newNumbers, config.operations, config.complexity);
      await new Promise(resolve => setTimeout(resolve, 100)); // Small delay to ensure data is ready
    }

    setDifficulty(level);
    setNumbers(puzzleData.usedNumbers);
    setTargetNumber(puzzleData.target);
    setHint(puzzleData.solution);
    setUserInput('');
    setMessage('');
    setTimeLeft(config.timeLimit);
    setHintsRemaining(3);
    setHintsUsed(0);
    setGameState('PLAYING');

    // Update stats
    setStats(prev => ({
      ...prev,
      gamesPlayed: prev.gamesPlayed + 1,
      difficultyPlayed: {
        ...prev.difficultyPlayed,
        [level]: (prev.difficultyPlayed[level] || 0) + 1
      }
    }));

    if (multiplayerMode) {
      startMultiplayerGame(level);
    }
  };
  const validateExpression = (expr, availableNumbers) => {
    try {
      // Remove all operators and parentheses to check numbers
      const usedNumbers = expr.match(/\d+/g)?.map(Number) || [];
      const numbersCopy = [...availableNumbers];

      // Check if all used numbers are available
      for (const num of usedNumbers) {
        const index = numbersCopy.indexOf(num);
        if (index === -1) return false;
        numbersCopy.splice(index, 1);
      }

      // Check if all numbers are used exactly once
      return usedNumbers.length === availableNumbers.length;
    } catch (error) {
      return false;
    }
  };

  const calculateScore = (timeBonus, difficulty) => {
    const baseScore = DIFFICULTY_LEVELS[difficulty].baseScore;
    const timeBonusPoints = Math.floor(timeBonus * (baseScore / DIFFICULTY_LEVELS[difficulty].timeLimit));
    const hintsUsedPenalty = hintsUsed * (baseScore * 0.1);
    return Math.max(0, baseScore + timeBonusPoints - hintsUsedPenalty);
  };

  const checkAchievements = useCallback(() => {
    Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
      if (!stats.achievements.includes(id) &&
        achievement.requirement(stats, timeLeft,
          DIFFICULTY_LEVELS[difficulty].timeLimit,
          difficulty, hintsUsed)) {
        setStats(prev => ({
          ...prev,
          achievements: [...prev.achievements, id]
        }));
        setShowAchievement(id);
        setTimeout(() => setShowAchievement(null), 3000);
      }
    });
  }, [stats, timeLeft, difficulty, hintsUsed]);

  const checkLevelUp = useCallback(() => {
    const xpGained = calculateScore(timeLeft, difficulty);
    const newXP = stats.totalScore + xpGained;
    const newLevel = Math.floor(newXP / 1000);

    if (newLevel > stats.level) {
      setLevelUpAnimation(true);
      setTimeout(() => setLevelUpAnimation(false), 3000);
    }

    setStats(prev => ({
      ...prev,
      level: newLevel,
      totalScore: newXP
    }));
  }, [stats, timeLeft, difficulty]);

  const handleGameOver = () => {
    setGameState('GAME_OVER');
    setMessage('Time is up! Try again.');
    setStats(prev => ({
      ...prev,
      currentStreak: 0
    }));

    if (multiplayerMode) {
      updateMultiplayerGame('LOST');
    }
  };

  const checkSolution = () => {
    try {
      if (!validateExpression(userInput, numbers)) {
        setMessage('Invalid solution: Use each number exactly once!');
        return;
      }

      const result = eval(userInput);
      if (result === targetNumber) {
        const newScore = calculateScore(timeLeft, difficulty);

        setScore(prev => prev + newScore);
        setStats(prev => ({
          ...prev,
          gamesWon: prev.gamesWon + 1,
          currentStreak: prev.currentStreak + 1,
          bestStreak: Math.max(prev.bestStreak, prev.currentStreak + 1),
          totalScore: prev.totalScore + newScore
        }));

        setMessage(`Correct! You earned ${newScore} points!`);
        setGameState('SUCCESS');

        checkAchievements();
        checkLevelUp();

        if (multiplayerMode) {
          updateMultiplayerGame('WON', newScore);
        }
      } else {
        setMessage('Not quite right. Try again!');
      }
    } catch (error) {
      setMessage('Invalid expression. Please check your formula.');
    }
  };

  // Multiplayer Logic
  const startMultiplayerGame = (level) => {
    // Simulate multiplayer game creation
    setMultiplayerGame({
      id: Math.random().toString(36).substr(2, 9),
      players: {
        player1: { id: 'current-user', score: 0, status: 'PLAYING' },
        player2: { id: 'opponent', score: 0, status: 'PLAYING' }
      },
      status: 'ACTIVE',
      puzzle: {
        numbers,
        targetNumber,
        difficulty: level
      },
      scores: {}
    });
  };

  const updateMultiplayerGame = (status, score = 0) => {
    if (!multiplayerGame) return;

    setMultiplayerGame(prev => ({
      ...prev,
      players: {
        ...prev.players,
        player1: {
          ...prev.players.player1,
          status,
          score
        }
      }
    }));

    // Simulate opponent's play
    setTimeout(() => {
      const opponentScore = Math.floor(Math.random() * score);
      setMultiplayerGame(prev => ({
        ...prev,
        players: {
          ...prev.players,
          player2: {
            ...prev.players.player2,
            status: 'FINISHED',
            score: opponentScore
          }
        },
        status: 'COMPLETED'
      }));
    }, Math.random() * 5000 + 2000);
  };

  // UI Components
  const Tutorial = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
    >
      <Card className="w-96">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xl font-bold">{TUTORIAL_STEPS[tutorialStep].title}</h3>
          <p>{TUTORIAL_STEPS[tutorialStep].content}</p>
          <Progress value={(tutorialStep + 1) * (100 / TUTORIAL_STEPS.length)} />
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => tutorialStep === 0 ? setShowTutorial(false) : setTutorialStep(prev => prev - 1)}
            >
              {tutorialStep === 0 ? 'Skip' : 'Previous'}
            </Button>
            <Button
              onClick={() => {
                if (tutorialStep === TUTORIAL_STEPS.length - 1) {
                  setShowTutorial(false);
                } else {
                  setTutorialStep(prev => prev + 1);
                }
              }}
            >
              {tutorialStep === TUTORIAL_STEPS.length - 1 ? 'Start Playing' : 'Next'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const AchievementPopup = ({ achievement }) => (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -50 }}
      className="fixed bottom-4 right-4 bg-green-600 text-white p-4 rounded-lg shadow-lg z-50"
    >
      <div className="flex items-center gap-2">
        <Award className="w-6 h-6" />
        <div>
          <div className="font-bold">{ACHIEVEMENTS[achievement].name}</div>
          <div className="text-sm">{ACHIEVEMENTS[achievement].description}</div>
        </div>
      </div>
    </motion.div>
  );

  const LevelUpAnimation = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.5 }}
      className="fixed inset-0 flex items-center justify-center z-50"
    >
      <div className="text-4xl font-bold text-yellow-400 bg-black bg-opacity-75 p-8 rounded-lg">
        Level Up! 🎉
      </div>
    </motion.div>
  );

  const MultiplayerStatus = () => (
    <Card className="mt-4">
      <CardContent className="p-4">
        <h3 className="font-bold mb-2">Multiplayer Match</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>You</span>
            <span>{multiplayerGame?.players.player1.score || 0} pts</span>
          </div>
          <div className="flex justify-between">
            <span>Opponent</span>
            <span>{multiplayerGame?.players.player2.score || 0} pts</span>
          </div>
          {multiplayerGame?.status === 'COMPLETED' && (
            <Alert>
              <AlertDescription>
                {multiplayerGame.players.player1.score > multiplayerGame.players.player2.score
                  ? 'You won! 🎉'
                  : multiplayerGame.players.player1.score < multiplayerGame.players.player2.score
                    ? 'You lost! 😢'
                    : 'It is a tie! 🤝'}
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const GameHeader = () => (
    <div className="flex items-center justify-between w-full mb-6">
      <div className="flex items-center gap-2">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetHeader>
              <SheetTitle>Progress & Stats</SheetTitle>
            </SheetHeader>
            <div className="mt-4 space-y-4">
              <ProgressCard />
              <AchievementsCard />
            </div>
          </SheetContent>
        </Sheet>
        <h1 className="text-2xl font-semibold">Math Brain Teaser</h1>
      </div>
      {gameState !== 'SELECT_LEVEL' && (
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="flex gap-2 p-2">
            <Clock className="w-4 h-4" />
            <span className="font-mono">{formatTime(timeLeft)}</span>
          </Badge>
          <Badge variant="secondary" className="flex gap-2 p-2">
            <Trophy className="w-4 h-4" />
            <span>{score}</span>
          </Badge>
        </div>
      )}
    </div>
  );

  const DifficultySelector = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(DIFFICULTY_LEVELS).map(([level, config]) => {
          const isLocked = bypassLocks ? false : stats.level < config.required.level;
    
          return (
            <TooltipProvider key={level}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div>
                    <Button
                      className="w-full relative group"
                      variant={isLocked ? "secondary" : "default"}
                      disabled={isLocked}
                      onClick={() => startGame(level)}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span>{config.name}</span>
                        <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  <p>{config.explanation}</p>
                  {isLocked && (
                    <p className="text-red-500 mt-1">
                      Unlocks at level {config.required.level}
                    </p>
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      <div className="flex justify-center gap-4">
        <Button
          variant="outline"
          onClick={() => setMultiplayerMode(!multiplayerMode)}
          className="w-40"
        >
          <Users className="w-4 h-4 mr-2" />
          {multiplayerMode ? 'Single Player' : 'Multiplayer'}
        </Button>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" className="w-40">
              <Book className="w-4 h-4 mr-2" />
              Tutorial
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>How to Play</DialogTitle>
              <DialogDescription>
                Learn the basics of Math Brain Teaser
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {TUTORIAL_STEPS.map((step, index) => (
                <div key={index} className="space-y-2">
                  <h3 className="font-semibold">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.content}</p>
                  {index < TUTORIAL_STEPS.length - 1 && <Separator />}
                </div>
              ))}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );


 
  // const GameBoard = () => (
  //   <div className="space-y-6">
  //     <div className="text-center space-y-4">
  //       <motion.div
  //         initial={{ scale: 0.9 }}
  //         animate={{ scale: 1 }}
  //         className="bg-blue-50 p-6 rounded-xl shadow-sm"
  //       >
  //         <span className="text-gray-600 block mb-2">Target</span>
  //         <span className="text-4xl font-bold text-blue-600">{targetNumber}</span>
  //       </motion.div>

  //       <div className="mt-8">
  //         <span className="text-gray-600 block mb-4">Available Numbers</span>
  //         <div className="flex flex-wrap justify-center gap-3">
  //           {numbers.map((num, index) => (
  //             <Button
  //               key={index}
  //               variant="outline"
  //               className="w-16 h-16 text-xl font-bold hover:bg-blue-50 transition-colors"
  //               onClick={() => {
  //                 const cursorPos = document.getElementById('solution-input').selectionStart;
  //                 const newValue = userInput.slice(0, cursorPos) + num + userInput.slice(cursorPos);
  //                 setUserInput(newValue);
  //                 document.getElementById('solution-input').focus();
  //               }}
  //             >
  //               {num}
  //             </Button>
  //           ))}
  //         </div>
  //       </div>
  //     </div>

  //     <div className="space-y-4">
  //       <div className="flex flex-wrap gap-2 justify-center">
  //         {DIFFICULTY_LEVELS[difficulty].operations.map((op) => (
  //           <Button
  //             key={op}
  //             variant="secondary"
  //             className="w-12 h-12 text-lg font-mono"
  //             onClick={() => {
  //               const cursorPos = document.getElementById('solution-input').selectionStart;
  //               const newValue = userInput.slice(0, cursorPos) + ` ${op} ` + userInput.slice(cursorPos);
  //               setUserInput(newValue);
  //               document.getElementById('solution-input').focus();
  //             }}
  //           >
  //             {op}
  //           </Button>
  //         ))}
  //       </div>

  //       <div className="relative">
  //         <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
  //         <input
  //           id="solution-input"
  //           type="text"
  //           value={userInput}
  //           onChange={(e) => setUserInput(e.target.value)}
  //           className="w-full p-4 pl-12 text-lg font-mono border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
  //           placeholder="Build your solution..."
  //           onKeyDown={(e) => {
  //             if (e.key === 'Enter') {
  //               checkSolution();
  //             }
  //           }}
  //         />
  //       </div>

  //       <div className="flex gap-3">
  //         <Button
  //           className="flex-1 h-12"
  //           onClick={checkSolution}
  //         >
  //           <Check className="w-5 h-5 mr-2" />
  //           Check Solution
  //         </Button>
  //         <Button
  //           variant="outline"
  //           onClick={() => {
  //             setUserInput('');
  //             document.getElementById('solution-input').focus();
  //           }}
  //           className="w-32 h-12"
  //         >
  //           <X className="w-5 h-5 mr-2" />
  //           Clear
  //         </Button>
  //       </div>
  //     </div>

  //     {message && (
  //       <Alert variant={gameState === 'SUCCESS' ? 'success' : 'error'}>
  //         <AlertDescription>{message}</AlertDescription>
  //       </Alert>
  //     )}

  //     {hintsRemaining > 0 && (
  //       <Button
  //         variant="ghost"
  //         className="w-full mt-4"
  //         onClick={() => {
  //           setHintsRemaining(prev => prev - 1);
  //           setHintsUsed(prev => prev + 1);
  //           setMessage(`Hint: Try using ${hint}`);
  //         }}
  //       >
  //         Use Hint ({hintsRemaining} remaining)
  //       </Button>
  //     )}
  //   </div>
  // );


  const GameBoard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-b from-gray-50 to-gray-100 p-6 rounded-xl shadow-sm">
        <div className="text-center space-y-6">
          <div>
            <span className="text-gray-600 text-sm">Target Number</span>
            <div className="text-4xl font-bold text-gray-900 mt-2">
              {targetNumber}
            </div>
          </div>
          
          <div>
            <span className="text-gray-600 text-sm">Available Numbers</span>
            <div className="flex flex-wrap justify-center gap-3 mt-2">
              {numbers.map((num, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="w-12 h-12 text-xl font-semibold hover:bg-gray-100"
                  onClick={() => {
                    const cursorPos = document.getElementById('solution-input').selectionStart;
                    const newValue = userInput.slice(0, cursorPos) + num + userInput.slice(cursorPos);
                    setUserInput(newValue);
                  }}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* New Hints Section */}
    <Card className="bg-gray-50 border-dashed">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-yellow-500" />
            <h3 className="font-semibold text-sm">Hints</h3>
          </div>
          <Badge variant="secondary">
            {hintsRemaining} remaining
          </Badge>
        </div>
        
        {message && message.startsWith('Hint:') ? (
          <Alert variant="default" className="bg-yellow-50 mt-2">
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        ) : (
          hintsRemaining > 0 ? (
            <Button
              variant="ghost"
              className="w-full text-sm text-gray-600 hover:text-gray-900"
              onClick={() => {
                setHintsRemaining(prev => prev - 1);
                setHintsUsed(prev => prev + 1);
                setMessage(`Hint: Try using ${hint}`);
              }}
            >
              <Lightbulb className="w-4 h-4 mr-2" />
              Use a hint
            </Button>
          ) : (
            <p className="text-sm text-gray-500 text-center py-2">No hints remaining</p>
          )
        )}
      </CardContent>
    </Card>


      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 justify-center">
          {DIFFICULTY_LEVELS[difficulty].operations.map((op) => (
            <TooltipProvider key={op}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="secondary"
                    className="w-10 h-10 text-lg font-mono"
                    onClick={() => {
                      const cursorPos = document.getElementById('solution-input').selectionStart;
                      const newValue = userInput.slice(0, cursorPos) + ` ${op} ` + userInput.slice(cursorPos);
                      setUserInput(newValue);
                    }}
                  >
                    {op}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {getOperationExplanation(op)}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>

        <div className="relative">
          <Calculator className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            id="solution-input"
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full p-4 pl-12 text-lg font-mono border rounded-lg focus:ring-2 focus:ring-gray-200"
            placeholder="Build your solution..."
            onKeyDown={(e) => e.key === 'Enter' && checkSolution()}
          />
        </div>

        <div className="flex gap-3">
          <Button
            className="flex-1"
            onClick={checkSolution}
          >
            <Check className="w-5 h-5 mr-2" />
            Check Solution
          </Button>
          <Button
            variant="outline"
            onClick={() => setUserInput('')}
          >
            <X className="w-5 h-5 mr-2" />
            Clear
          </Button>
        </div>
      </div>

{/* does not start with Hint */}
      {message && !message.startsWith('Hint:') && (
        <Alert variant={gameState === 'SUCCESS' ? 'success' : 'error'}>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );



  const ProgressCard = () => (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">Progress</h3>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Level {stats.level}</span>
            <span>{stats.totalScore} XP</span>
          </div>
          <Progress
            value={(stats.totalScore % 1000) / 10}
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );


  const AchievementsCard = () => (
    <Card>
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2">Achievements</h3>
        <div className="space-y-2">
          {Object.entries(ACHIEVEMENTS).map(([key, achievement]) => (
            <div
              key={key}
              className={`flex items-center gap-2 ${
                stats.achievements.includes(key)
                  ? 'text-gray-900'
                  : 'text-gray-400'
              }`}
            >
              <span>{achievement.icon}</span>
              <span className="text-sm">{achievement.name}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="relative max-w-4xl mx-auto p-4">
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <Card className="w-full">
            <CardContent className="p-6">
              <GameHeader />
              {gameState === 'SELECT_LEVEL' && <DifficultySelector />}
              {gameState === 'PLAYING' && <GameBoard />}
              {(gameState === 'SUCCESS' || gameState === 'GAME_OVER') && (
                <div className="text-center space-y-4">
                  <h3 className={`text-xl font-bold ${
                    gameState === 'SUCCESS' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {gameState === 'SUCCESS' ? 'Congratulations!' : 'Game Over'}
                  </h3>
                  <div className="space-y-2">
                    <Button
                      onClick={() => startGame(difficulty)}
                      className="w-48"
                    >
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Play Again
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setGameState('SELECT_LEVEL')}
                      className="w-48"
                    >
                      <ArrowLeftCircle className="w-4 h-4 mr-2" />
                      Change Level
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="hidden md:block w-64 space-y-4">
          <ProgressCard />
          <AchievementsCard />
        </div>
      </div>

      <AnimatePresence>
        {showAchievement && <AchievementPopup achievement={showAchievement} />}
        {levelUpAnimation && <LevelUpAnimation />}
      </AnimatePresence>
    </div>
  );
};

// Helper function for time formatting
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

// Helper function for operation explanations
const getOperationExplanation = (operation) => {
  const explanations = {
    '+': 'Addition combines numbers together',
    '-': 'Subtraction finds the difference between numbers',
    '*': 'Multiplication is repeated addition',
    '/': 'Division splits numbers into equal parts',
    'sqrt': 'Square root finds what number multiplied by itself equals this',
    'pow': 'Power raises a number to an exponent',
    '%': 'Modulo finds the remainder after division'
  };
  return explanations[operation];
};

export default MathBrainTeaser;