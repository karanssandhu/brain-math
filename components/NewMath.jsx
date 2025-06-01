// import React, { useState, useEffect, memo } from 'react';
// import { evaluate } from 'mathjs';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Calculator, RefreshCw, Check, X, ArrowLeft, Trophy, HelpCircle, Settings, Share } from 'lucide-react';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Progress } from '@/components/ui/progress';
// import { Badge } from '@/components/ui/badge';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';

// // Difficulty configurations
// const DIFFICULTY_CONFIGS = {
//   BEGINNER: { numberCount: 5, timeLimit: 120, baseScore: 100, description: "Combine numbers creatively" },
//   INTERMEDIATE: { numberCount: 6, timeLimit: 180, baseScore: 200, description: "More numbers, more possibilities" },
//   ADVANCED: { numberCount: 4, timeLimit: 240, baseScore: 300, description: "Complex combinations" },
// };

// // Generate unique random integers between 0 and 10
// const generateUniqueNumbers = (count) => {
//   const numbers = new Set();
//   while (numbers.size < count) {
//     numbers.add(Math.floor(Math.random() * 11));
//   }
//   return Array.from(numbers);
// };

// // Generate a random integer expression using all numbers, including exponents
// const generateRandomExpression = (numbers) => {
//   if (numbers.length === 1) return { expr: numbers[0].toString(), value: numbers[0] };
//   const index = Math.floor(Math.random() * (numbers.length - 1)) + 1;
//   const left = numbers.slice(0, index);
//   const right = numbers.slice(index);
//   const leftResult = generateRandomExpression(left);
//   const rightResult = generateRandomExpression(right);
//   const operations = ['+', '-', '*', '/', '**'];
//   if (rightResult.value === 0 && operations.includes('/')) operations.splice(operations.indexOf('/'), 1);
//   const op = operations[Math.floor(Math.random() * operations.length)];
//   let value;
//   if (op === '+') value = leftResult.value + rightResult.value;
//   else if (op === '-') value = leftResult.value - rightResult.value;
//   else if (op === '*') value = leftResult.value * rightResult.value;
//   else if (op === '/') value = leftResult.value / rightResult.value;
//   else if (op === '**') value = Math.pow(leftResult.value, rightResult.value);
//   const expr = `(${leftResult.expr} ${op === '**' ? '^' : op} ${rightResult.expr})`;
//   return { expr, value };
// };

// // Memoized sub-components
// const NumberButtons = memo(({ numbers, usedNumbers, setUserInput, userInput }) => (
//   <div className="grid grid-cols-3 gap-3">
//     {numbers.map((num, i) => (
//       <motion.button
//         key={i}
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//         onClick={() => !usedNumbers.includes(num) && setUserInput(userInput + num)}
//         className={`h-14 text-xl font-bold rounded-lg shadow-md transition-colors ${
//           usedNumbers.includes(num)
//             ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
//             : 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800'
//         }`}
//         disabled={usedNumbers.includes(num)}
//       >
//         {num}
//       </motion.button>
//     ))}
//   </div>
// ));

// const OperationButtons = memo(({ setUserInput, userInput }) => (
//   <div className="grid grid-cols-3 gap-3">
//     {['+', '-', '*', '/', '^', '(', ')'].map((op) => (
//       <motion.button
//         key={op}
//         whileHover={{ scale: 1.1 }}
//         whileTap={{ scale: 0.9 }}
//         onClick={() => setUserInput(userInput + ` ${op} `)}
//         className="h-14 text-xl font-mono bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
//       >
//         {op}
//       </motion.button>
//     ))}
//   </div>
// ));

// const MathGame = () => {
//   const [gameState, setGameState] = useState('MENU');
//   const [difficulty, setDifficulty] = useState(null);
//   const [numbers, setNumbers] = useState([]);
//   const [target, setTarget] = useState(null);
//   const [userInput, setUserInput] = useState('');
//   const [liveResult, setLiveResult] = useState('--'); // New state for live calculation
//   const [message, setMessage] = useState('');
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [score, setScore] = useState(0);
//   const [solutions, setSolutions] = useState([]);
//   const [showQuitDialog, setShowQuitDialog] = useState(false);
//   const [showHelpDialog, setShowHelpDialog] = useState(false);
//   const [stats, setStats] = useState({
//     gamesPlayed: 0,
//     gamesWon: 0,
//     totalScore: 0,
//     winRate: 0,
//     highScore: 0,
//     streak: 0,
//   });

//   useEffect(() => {
//     const savedStats = localStorage.getItem('mathGameStats');
//     if (savedStats) setStats(JSON.parse(savedStats));
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('mathGameStats', JSON.stringify(stats));
//   }, [stats]);

//   // Live calculation effect
//   useEffect(() => {
//     if (!userInput.trim()) {
//       setLiveResult('--');
//       return;
//     }
//     try {
//       const result = evaluate(userInput);
//       setLiveResult(Number.isInteger(result) ? result : result.toFixed(2)); // Show integer or 2 decimal places
//     } catch {
//       setLiveResult('Invalid');
//     }
//   }, [userInput]);

//   const updateStats = (won, scoreToAdd = 0) => {
//     setStats((prev) => {
//       const gamesPlayed = prev.gamesPlayed + 1;
//       const gamesWon = won ? prev.gamesWon + 1 : prev.gamesWon;
//       return {
//         gamesPlayed,
//         gamesWon,
//         totalScore: prev.totalScore + scoreToAdd,
//         highScore: Math.max(prev.highScore, scoreToAdd),
//         streak: won ? prev.streak + 1 : 0,
//         winRate: ((gamesWon / gamesPlayed) * 100).toFixed(1),
//       };
//     });
//   };

//   const startGame = (selectedDifficulty) => {
//     const config = DIFFICULTY_CONFIGS[selectedDifficulty];
//     const numbers = generateUniqueNumbers(config.numberCount);
//     let solution;
//     do {
//       solution = generateRandomExpression(numbers);
//     } while (!Number.isInteger(solution.value) || isNaN(solution.value) || !isFinite(solution.value) || solution.value > 10000 || solution.value < -10000);
//     setDifficulty(selectedDifficulty);
//     setNumbers(numbers);
//     setTarget(solution.value);
//     setSolutions([solution.expr]);
//     setTimeLeft(config.timeLimit);
//     setGameState('PLAYING');
//     setUserInput('');
//     setLiveResult('--');
//     setMessage('');
//     updateStats(false);
//   };

//   const checkSolution = () => {
//     if (!userInput.trim()) return setMessage('Please enter a solution');
//     const cleaned = userInput.replace(/[\d+\+\-\*\/\^\(\)\s]/g, '');
//     if (cleaned !== '') return setMessage('Invalid characters in expression');
//     const usedNumbers = userInput.match(/\d+/g)?.map(Number) || [];
//     if (usedNumbers.some(num => !numbers.includes(num))) return setMessage('Used numbers not provided');
//     if (new Set(usedNumbers).size !== usedNumbers.length) return setMessage('Cannot use a number more than once');
//     try {
//       const result = evaluate(userInput);
//       const config = DIFFICULTY_CONFIGS[difficulty];
//       const timeBonus = Math.floor(timeLeft * (config.baseScore / config.timeLimit));
//       const scoreToAdd = Math.abs(result - target) < 1e-9 ? config.baseScore + timeBonus : 0;
//       if (scoreToAdd > 0) {
//         setScore(scoreToAdd);
//         setStats(prev => ({ ...prev, totalScore: prev.totalScore + scoreToAdd }));
//         setGameState('SUCCESS');
//         updateStats(true, scoreToAdd);
//         setMessage(`Correct! Earned ${scoreToAdd} points!`);
//       } else {
//         setMessage('Incorrect solution. Try again!');
//       }
//     } catch (error) {
//       setMessage('Invalid expression: ' + error.message);
//     }
//   };

//   useEffect(() => {
//     let timer;
//     if (gameState === 'PLAYING' && timeLeft > 0) {
//       timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
//     } else if (timeLeft === 0 && gameState === 'PLAYING') {
//       setGameState('GAME_OVER');
//       setMessage('Time’s up!');
//     }
//     return () => clearInterval(timer);
//   }, [timeLeft, gameState]);

//   const GameHeader = () => (
//     <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 shadow-lg">
//       <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
//         <Button variant="ghost" size="icon" onClick={() => setShowQuitDialog(true)} className="text-white hover:bg-blue-700">
//           <ArrowLeft className="h-5 w-5" />
//         </Button>
//         <h1 className="text-2xl font-extrabold tracking-wide">MATHLE</h1>
//         <div className="flex gap-2">
//           <Button variant="ghost" size="icon" onClick={() => setShowHelpDialog(true)} className="text-white hover:bg-blue-700">
//             <HelpCircle className="h-5 w-5" />
//           </Button>
//           <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700">
//             <Settings className="h-5 w-5" />
//           </Button>
//         </div>
//       </div>
//     </header>
//   );

//   const MenuScreen = () => (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="max-w-2xl mx-auto px-4 py-12 text-center space-y-10"
//     >
//       <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
//         Welcome to Mathle
//       </h2>
//       <p className="text-lg text-gray-600 dark:text-gray-300">Solve daily math puzzles with a twist!</p>
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
//         {[
//           { icon: Trophy, label: "Total Score", value: stats.totalScore, desc: "All-time points" },
//           { icon: Calculator, label: "Games Won", value: stats.gamesWon, desc: `${stats.gamesPlayed} played` },
//           { icon: RefreshCw, label: "Win Rate", value: `${stats.winRate}%`, desc: `${stats.streak} streak` },
//         ].map((stat, i) => (
//           <motion.div
//             key={i}
//             whileHover={{ scale: 1.05 }}
//             className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md"
//           >
//             <stat.icon className="h-6 w-6 text-blue-500 mx-auto" />
//             <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{stat.label}</p>
//             <p className="text-2xl font-bold">{stat.value}</p>
//             <p className="text-xs text-gray-400">{stat.desc}</p>
//           </motion.div>
//         ))}
//       </div>
//       <div className="space-y-4">
//         <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Choose Your Challenge</h3>
//         <div className="grid gap-4 sm:grid-cols-3">
//           {Object.entries(DIFFICULTY_CONFIGS).map(([key, config]) => (
//             <motion.button
//               key={key}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               onClick={() => startGame(key)}
//               className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow"
//             >
//               <div className="text-left">
//                 <p className="font-bold text-lg text-gray-800 dark:text-gray-200">
//                   {key.charAt(0) + key.slice(1).toLowerCase()}
//                 </p>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">{config.description}</p>
//               </div>
//               <Badge className="mt-2 bg-blue-500">{config.baseScore} pts</Badge>
//             </motion.button>
//           ))}
//         </div>
//       </div>
//     </motion.div>
//   );

//   const GameScreen = () => {
//     const usedNumbers = userInput.match(/\d+/g)?.map(Number) || [];
//     const isCorrect = liveResult !== 'Invalid' && liveResult !== '--' && Math.abs(liveResult - target) < 1e-9;
//     return (
//       <div className="max-w-3xl mx-auto px-4 py-8 space-y-8">
//         <div className="flex justify-between items-center">
//           <div className="text-center">
//             <motion.h2
//               initial={{ scale: 1 }}
//               animate={{ scale: timeLeft < 30 ? [1, 1.05, 1] : 1 }}
//               transition={{ duration: 1, repeat: timeLeft < 30 ? Infinity : 0 }}
//               className="text-4xl font-bold text-blue-600"
//             >
//               {Math.round(target)}
//             </motion.h2>
//             <p className="text-sm text-gray-600 dark:text-gray-400">Target</p>
//           </div>
//           <div className="text-right">
//             <p className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200">
//               {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
//             </p>
//             <p className="text-sm text-gray-600 dark:text-gray-400">Time Left</p>
//           </div>
//         </div>
//         <Progress
//           value={(timeLeft / DIFFICULTY_CONFIGS[difficulty].timeLimit) * 100}
//           className={`h-2 ${timeLeft < 30 ? 'bg-red-500' : 'bg-blue-500'}`}
//         />
//         <div className="space-y-2">
//           <input
//             type="text"
//             value={userInput}
//             onChange={(e) => setUserInput(e.target.value)}
//             className="w-full p-4 text-xl font-mono border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//             placeholder="Your solution..."
//             onKeyDown={(e) => e.key === 'Enter' && checkSolution()}
//           />
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.3 }}
//             className={`text-center text-lg font-mono ${isCorrect ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}
//           >
//             = {liveResult}
//           </motion.div>
//         </div>
//         <div className="grid sm:grid-cols-2 gap-6">
//           <div className="space-y-4">
//             <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Numbers</p>
//             <NumberButtons numbers={numbers} usedNumbers={usedNumbers} setUserInput={setUserInput} userInput={userInput} />
//           </div>
//           <div className="space-y-4">
//             <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Operations</p>
//             <OperationButtons setUserInput={setUserInput} userInput={userInput} />
//           </div>
//         </div>
//         <div className="flex gap-4 justify-center">
//           <Button
//             onClick={checkSolution}
//             className="flex-1 h-12 bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
//           >
//             <Check className="w-5 h-5 mr-2" /> Check
//           </Button>
//           <Button
//             onClick={() => setMessage(solutions[0])}
//             className="flex-1 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
//           >
//             <HelpCircle className="w-5 h-5 mr-2" /> Hint
//           </Button>
//           <Button
//             onClick={() => setUserInput('')}
//             variant="outline"
//             className="h-12 px-6 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
//           >
//             <X className="w-5 h-5" />
//           </Button>
//         </div>
//         <AnimatePresence>
//           {message && (
//             <motion.div
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 10 }}
//               className="mt-4"
//             >
//               <Alert className={message.includes('Correct') ? 'bg-green-100' : 'bg-red-100'}>
//                 <AlertDescription className="text-center">{message}</AlertDescription>
//               </Alert>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     );
//   };

//   const ResultScreen = () => (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.95 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.5 }}
//       className="max-w-md mx-auto px-4 py-12"
//     >
//       <Card className="p-6 text-center space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
//         <motion.h3
//           animate={{ scale: [1, 1.1, 1] }}
//           transition={{ duration: 1, repeat: gameState === 'SUCCESS' ? 2 : 0 }}
//           className={`text-3xl font-bold ${gameState === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}
//         >
//           {gameState === 'SUCCESS' ? '🎉 Brilliant!' : '⏰ Time’s Up!'}
//         </motion.h3>
//         <p className="text-gray-600 dark:text-gray-300">
//           {gameState === 'SUCCESS' ? `Solved with ${timeLeft}s left!` : 'Better luck next time!'}
//         </p>
//         <div className="grid grid-cols-2 gap-4">
//           <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
//             <p className="text-3xl font-bold text-blue-600">{score}</p>
//             <p className="text-sm text-gray-500">Round Score</p>
//           </div>
//           <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
//             <p className="text-3xl font-bold text-blue-600">{stats.totalScore}</p>
//             <p className="text-sm text-gray-500">Total Score</p>
//           </div>
//         </div>
//         {solutions.length > 0 && (
//           <Card className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
//             <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Example Solution</p>
//             <p className="text-lg font-mono text-gray-600 dark:text-gray-300">{solutions[0]}</p>
//           </Card>
//         )}
//         <div className="flex flex-col gap-3">
//           <Button onClick={() => startGame(difficulty)} className="h-12 bg-blue-500 hover:bg-blue-600">
//             <RefreshCw className="w-5 h-5 mr-2" /> Play Again
//           </Button>
//           <Button
//             variant="outline"
//             onClick={() => setGameState('MENU')}
//             className="h-12 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
//           >
//             Change Difficulty
//           </Button>
//           <Button variant="secondary" className="h-12 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">
//             <Share className="w-5 h-5 mr-2" /> Share Score
//           </Button>
//         </div>
//       </Card>
//     </motion.div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-blue-900">
//       <GameHeader />
//       <AnimatePresence mode="wait">
//         {gameState === 'MENU' && <MenuScreen key="menu" />}
//         {gameState === 'PLAYING' && <GameScreen key="game" />}
//         {(gameState === 'SUCCESS' || gameState === 'GAME_OVER') && <ResultScreen key="result" />}
//       </AnimatePresence>

//       <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
//         <DialogContent className="rounded-xl">
//           <DialogHeader>
//             <DialogTitle>Quit Game?</DialogTitle>
//             <DialogDescription>Are you sure? Your progress will be lost.</DialogDescription>
//           </DialogHeader>
//           <DialogFooter className="flex justify-end gap-2">
//             <Button variant="outline" onClick={() => setShowQuitDialog(false)}>
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={() => { setShowQuitDialog(false); setGameState('MENU'); setScore(0); }}>
//               Quit
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
//         <DialogContent className="rounded-xl">
//           <DialogHeader>
//             <DialogTitle>How to Play</DialogTitle>
//             <DialogDescription className="space-y-4">
//               <p>Use any subset of the given numbers with +, -, *, /, or ^ (exponents) to match the target.</p>
//               <ul className="list-disc pl-4 space-y-2">
//                 <li>Each number can be used at most once</li>
//                 <li>Use proper notation with parentheses if needed</li>
//                 <li>Solve within the time limit for points</li>
//                 <li>Faster solutions = more points</li>
//               </ul>
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button onClick={() => setShowHelpDialog(false)} className="bg-blue-500 hover:bg-blue-600">
//               Got it!
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default MathGame;


// // This code is a React component for a math game called "Mathle".

// import React, { useState, useEffect, memo, useRef } from 'react';
// import { evaluate } from 'mathjs';
// import { motion, AnimatePresence } from 'framer-motion';
// import { Calculator, RefreshCw, Check, X, ArrowLeft, Trophy, HelpCircle, Settings, Share } from 'lucide-react';
// import { Card } from '@/components/ui/card';
// import { Button } from '@/components/ui/button';
// import { Alert, AlertDescription } from '@/components/ui/alert';
// import { Progress } from '@/components/ui/progress';
// import { Badge } from '@/components/ui/badge';
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from '@/components/ui/dialog';

// // Difficulty configurations
// const DIFFICULTY_CONFIGS = {
//   BEGINNER: { numberCount: 5, timeLimit: 120, baseScore: 100, description: "Combine numbers creatively", targetRange: { min: 10, max: 199 } },
//   INTERMEDIATE: { numberCount: 6, timeLimit: 180, baseScore: 200, description: "More numbers, more possibilities", targetRange: { min: 100, max: 299 } },
//   ADVANCED: { numberCount: 4, timeLimit: 240, baseScore: 300, description: "Complex combinations", targetRange: { min: 100, max: 399 } },
// };

// // Generate unique random integers between 0 and 10, excluding the target
// const generateUniqueNumbers = (count, excludeTarget = null) => {
//   const numbers = new Set();
//   while (numbers.size < count) {
//     const num = Math.floor(Math.random() * 10);
//     if (num !== excludeTarget) {
//       numbers.add(num);
//     }
//   }
//   return Array.from(numbers);
// };

// // Generate a random integer expression using all numbers, including exponents
// const generateRandomExpression = (numbers) => {
//   if (numbers.length === 1) return { expr: numbers[0].toString(), value: numbers[0] };
//   const index = Math.floor(Math.random() * (numbers.length - 1)) + 1;
//   const left = numbers.slice(0, index);
//   const right = numbers.slice(index);
//   const leftResult = generateRandomExpression(left);
//   const rightResult = generateRandomExpression(right);
//   const operations = ['+', '-', '*', '/', '**'];
//   if (rightResult.value === 0 && operations.includes('/')) operations.splice(operations.indexOf('/'), 1);
//   const op = operations[Math.floor(Math.random() * operations.length)];
//   let value;
//   if (op === '+') value = leftResult.value + rightResult.value;
//   else if (op === '-') value = leftResult.value - rightResult.value;
//   else if (op === '*') value = leftResult.value * rightResult.value;
//   else if (op === '/') value = leftResult.value / rightResult.value;
//   else if (op === '**') value = Math.pow(leftResult.value, rightResult.value);
//   const expr = `(${leftResult.expr} ${op === '**' ? '^' : op} ${rightResult.expr})`;
//   return { expr, value };
// };

// // Helper function to evaluate expression with custom functions
// const evaluateExpression = (expr) => {
//   // Replace custom functions with mathjs equivalents
//   let processedExpr = expr
//     .replace(/sqrt\(/g, 'sqrt(')
//     .replace(/cbrt\(/g, 'nthRoot(')
//     .replace(/!/g, ' factorial ')
//     .replace(/\^/g, '^');
  
//   // Handle cube root notation cbrt(x) -> nthRoot(x, 3)
//   processedExpr = processedExpr.replace(/cbrt\(([^)]+)\)/g, 'nthRoot($1, 3)');
  
//   return evaluate(processedExpr);
// };

// // Memoized sub-components
// const NumberButtons = memo(({ numbers, usedNumbers, insertAtCursor }) => {
//   return (
//     <div className="space-y-4">
//       <div>
//         <p className="text-xs text-gray-500 mb-2">Available Numbers</p>
//         <div className="grid grid-cols-3 gap-3">
//           {numbers.map((num, i) => (
//             <motion.button
//               key={i}
//               whileHover={{ scale: 1.1 }}
//               whileTap={{ scale: 0.9 }}
//               onClick={() => !usedNumbers.includes(num) && insertAtCursor(num.toString())}
//               className={`h-14 text-xl font-bold rounded-lg shadow-md transition-colors ${
//                 usedNumbers.includes(num)
//                   ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
//                   : 'bg-blue-100 dark:bg-blue-900 hover:bg-blue-200 dark:hover:bg-blue-800'
//               }`}
//               disabled={usedNumbers.includes(num)}
//             >
//               {num}
//             </motion.button>
//           ))}
//         </div>
//         <p className="text-xs text-gray-400 mt-2 text-center">
//           Combine digits to form multi-digit numbers (e.g., 1 + 2 = 12)
//         </p>
//       </div>
//     </div>
//   );
// });

// const OperationButtons = memo(({ insertAtCursor }) => (
//   <div className="space-y-4">
//     <div>
//       <p className="text-xs text-gray-500 mb-2">Basic Operations</p>
//       <div className="grid grid-cols-3 gap-3">
//         {['+', '-', '*', '/', '^', '(', ')'].map((op) => (
//           <motion.button
//             key={op}
//             whileHover={{ scale: 1.1 }}
//             whileTap={{ scale: 0.9 }}
//             onClick={() => insertAtCursor(` ${op} `)}
//             className="h-14 text-xl font-mono bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
//           >
//             {op}
//           </motion.button>
//         ))}
//       </div>
//     </div>
    
//     <div>
//       <p className="text-xs text-gray-500 mb-2">Advanced Functions</p>
//       <div className="grid grid-cols-2 gap-2">
//         {[
//           { symbol: '!', display: 'n!', title: 'Factorial' },
//           { symbol: 'sqrt(', display: '√', title: 'Square Root' },
//           { symbol: 'cbrt(', display: '∛', title: 'Cube Root' },
//         ].map((func) => (
//           <motion.button
//             key={func.symbol}
//             whileHover={{ scale: 1.05 }}
//             whileTap={{ scale: 0.95 }}
//             onClick={() => insertAtCursor(func.symbol)}
//             className="h-10 text-sm font-mono bg-purple-100 dark:bg-purple-900 rounded-lg shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
//             title={func.title}
//           >
//             {func.display}
//           </motion.button>
//         ))}
//       </div>
//     </div>
//   </div>
// ));

// const MathGame = () => {
//   const [gameState, setGameState] = useState('MENU');
//   const [difficulty, setDifficulty] = useState(null);
//   const [numbers, setNumbers] = useState([]);
//   const [target, setTarget] = useState(null);
//   const [userInput, setUserInput] = useState('');
//   const [liveResult, setLiveResult] = useState('--');
//   const [message, setMessage] = useState('');
//   const [timeLeft, setTimeLeft] = useState(0);
//   const [score, setScore] = useState(0);
//   const [solutions, setSolutions] = useState([]);
//   const [showQuitDialog, setShowQuitDialog] = useState(false);
//   const [showHelpDialog, setShowHelpDialog] = useState(false);
//   const [stats, setStats] = useState({
//     gamesPlayed: 0,
//     gamesWon: 0,
//     totalScore: 0,
//     winRate: 0,
//     highScore: 0,
//     streak: 0,
//   });
  
//   const inputRef = useRef(null);

//   // Function to insert text at cursor position
//   const insertAtCursor = (text) => {
//     const input = inputRef.current;
//     if (!input) return;
    
//     const start = input.selectionStart;
//     const end = input.selectionEnd;
//     const newValue = userInput.substring(0, start) + text + userInput.substring(end);
    
//     setUserInput(newValue);
    
//     // Set cursor position after the inserted text
//     setTimeout(() => {
//       const newCursorPos = start + text.length;
//       input.setSelectionRange(newCursorPos, newCursorPos);
//       input.focus();
//     }, 0);
//   };

//   useEffect(() => {
//     const savedStats = JSON.parse(localStorage.getItem('mathGameStats') || '{}');
//     if (Object.keys(savedStats).length > 0) setStats(savedStats);
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('mathGameStats', JSON.stringify(stats));
//   }, [stats]);

//   // Live calculation effect
//   useEffect(() => {
//     if (!userInput.trim()) {
//       setLiveResult('--');
//       return;
//     }
//     try {
//       const result = evaluateExpression(userInput);
//       setLiveResult(Number.isInteger(result) ? result : result.toFixed(2));
//     } catch {
//       setLiveResult('Invalid');
//     }
//   }, [userInput]);

//   const updateStats = (won, scoreToAdd = 0) => {
//     setStats((prev) => {
//       const gamesPlayed = prev.gamesPlayed + 1;
//       const gamesWon = won ? prev.gamesWon + 1 : prev.gamesWon;
//       return {
//         gamesPlayed,
//         gamesWon,
//         totalScore: prev.totalScore + scoreToAdd,
//         highScore: Math.max(prev.highScore, scoreToAdd),
//         streak: won ? prev.streak + 1 : 0,
//         winRate: ((gamesWon / gamesPlayed) * 100).toFixed(1),
//       };
//     });
//   };

//   const startGame = (selectedDifficulty) => {
//     const config = DIFFICULTY_CONFIGS[selectedDifficulty];
//     let solution, targetValue, gameNumbers;
    
//     // Generate a valid puzzle
//     do {
//       // First generate numbers without target restriction to create expression
//       const tempNumbers = generateUniqueNumbers(config.numberCount);
//       solution = generateRandomExpression(tempNumbers);
//       targetValue = solution.value;
      
//       // Now generate final numbers excluding the target if it's a single digit
//       if (targetValue >= 0 && targetValue <= 10 && Number.isInteger(targetValue)) {
//         gameNumbers = generateUniqueNumbers(config.numberCount, targetValue);
//       } else {
//         gameNumbers = tempNumbers;
//       }
//     } while (
//       !Number.isInteger(targetValue) || 
//       isNaN(targetValue) || 
//       !isFinite(targetValue) || 
//       targetValue < config.targetRange.min ||
//       targetValue > config.targetRange.max ||
//       gameNumbers.includes(targetValue) // Ensure target is not in available numbers
//     );
    
//     setDifficulty(selectedDifficulty);
//     setNumbers(gameNumbers);
//     setTarget(targetValue);
//     setSolutions([solution.expr]);
//     setTimeLeft(config.timeLimit);
//     setGameState('PLAYING');
//     setUserInput('');
//     setLiveResult('--');
//     setMessage('');
//     updateStats(false);
//   };

//   const checkSolution = () => {
//     if (!userInput.trim()) return setMessage('Please enter a solution');
    
//     // Extract numbers used in the expression (including multi-digit)
//     const numberMatches = userInput.match(/\d+/g) || [];
//     const usedDigits = [];
    
//     // For each number in the expression, check if it's valid
//     for (const numStr of numberMatches) {
//       const digits = numStr.split('').map(d => parseInt(d));
//       for (const digit of digits) {
//         if (!numbers.includes(digit)) {
//           return setMessage(`Digit ${digit} not available in provided numbers`);
//         }
//         usedDigits.push(digit);
//       }
//     }
    
//     // Check if any digit is used more than once
//     const digitCounts = {};
//     const availableCounts = {};
    
//     // Count available digits
//     numbers.forEach(num => {
//       availableCounts[num] = (availableCounts[num] || 0) + 1;
//     });
    
//     // Count used digits
//     usedDigits.forEach(digit => {
//       digitCounts[digit] = (digitCounts[digit] || 0) + 1;
//     });
    
//     // Check if we're using more of any digit than available
//     for (const [digit, count] of Object.entries(digitCounts)) {
//       if (count > (availableCounts[digit] || 0)) {
//         return setMessage(`Used digit ${digit} more times than available`);
//       }
//     }
    
//     try {
//       const result = evaluateExpression(userInput);
//       const config = DIFFICULTY_CONFIGS[difficulty];
//       const timeBonus = Math.floor(timeLeft * (config.baseScore / config.timeLimit));
//       const scoreToAdd = Math.abs(result - target) < 1e-9 ? config.baseScore + timeBonus : 0;
//       if (scoreToAdd > 0) {
//         setScore(scoreToAdd);
//         setStats(prev => ({ ...prev, totalScore: prev.totalScore + scoreToAdd }));
//         setGameState('SUCCESS');
//         updateStats(true, scoreToAdd);
//         setMessage(`Correct! Earned ${scoreToAdd} points!`);
//       } else {
//         setMessage('Incorrect solution. Try again!');
//       }
//     } catch (error) {
//       setMessage('Invalid expression: ' + error.message);
//     }
//   };

//   useEffect(() => {
//     let timer;
//     if (gameState === 'PLAYING' && timeLeft > 0) {
//       timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
//     } else if (timeLeft === 0 && gameState === 'PLAYING') {
//       setGameState('GAME_OVER');
//       setMessage('Time\'s up!');
//     }
//     return () => clearInterval(timer);
//   }, [timeLeft, gameState]);

//   const GameHeader = () => (
//     <header className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 shadow-lg">
//       <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
//         <Button variant="ghost" size="icon" onClick={() => setShowQuitDialog(true)} className="text-white hover:bg-blue-700">
//           <ArrowLeft className="h-5 w-5" />
//         </Button>
//         <h1 className="text-2xl font-extrabold tracking-wide">MATHLE</h1>
//         <div className="flex gap-2">
//           <Button variant="ghost" size="icon" onClick={() => setShowHelpDialog(true)} className="text-white hover:bg-blue-700">
//             <HelpCircle className="h-5 w-5" />
//           </Button>
//           <Button variant="ghost" size="icon" className="text-white hover:bg-blue-700">
//             <Settings className="h-5 w-5" />
//           </Button>
//         </div>
//       </div>
//     </header>
//   );

//   const MenuScreen = () => (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.5 }}
//       className="max-w-2xl mx-auto px-4 py-12 text-center space-y-10"
//     >
//       <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
//         Welcome to Mathle
//       </h2>
//       <p className="text-lg text-gray-600 dark:text-gray-300">Solve daily math puzzles with a twist!</p>
//       <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
//         {[
//           { icon: Trophy, label: "Total Score", value: stats.totalScore, desc: "All-time points" },
//           { icon: Calculator, label: "Games Won", value: stats.gamesWon, desc: `${stats.gamesPlayed} played` },
//           { icon: RefreshCw, label: "Win Rate", value: `${stats.winRate}%`, desc: `${stats.streak} streak` },
//         ].map((stat, i) => (
//           <motion.div
//             key={i}
//             whileHover={{ scale: 1.05 }}
//             className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md"
//           >
//             <stat.icon className="h-6 w-6 text-blue-500 mx-auto" />
//             <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{stat.label}</p>
//             <p className="text-2xl font-bold">{stat.value}</p>
//             <p className="text-xs text-gray-400">{stat.desc}</p>
//           </motion.div>
//         ))}
//       </div>
//       <div className="space-y-4">
//         <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Choose Your Challenge</h3>
//         <div className="grid gap-4 sm:grid-cols-3">
//           {Object.entries(DIFFICULTY_CONFIGS).map(([key, config]) => (
//             <motion.button
//               key={key}
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//               onClick={() => startGame(key)}
//               className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md hover:shadow-lg transition-shadow"
//             >
//               <div className="text-left">
//                 <p className="font-bold text-lg text-gray-800 dark:text-gray-200">
//                   {key.charAt(0) + key.slice(1).toLowerCase()}
//                 </p>
//                 <p className="text-sm text-gray-500 dark:text-gray-400">{config.description}</p>
//               </div>
//               <Badge className="mt-2 bg-blue-500">{config.baseScore} pts</Badge>
//             </motion.button>
//           ))}
//         </div>
//       </div>
//     </motion.div>
//   );

//   const GameScreen = () => {
//     // Extract used digits from current input
//     const numberMatches = userInput.match(/\d+/g) || [];
//     const usedNumbers = [];
    
//     numberMatches.forEach(numStr => {
//       // For any number in the expression, add each digit
//       numStr.split('').forEach(digit => {
//         usedNumbers.push(parseInt(digit));
//       });
//     });
    
//     const isCorrect = liveResult !== 'Invalid' && liveResult !== '--' && Math.abs(liveResult - target) < 1e-9;
    
//     return (
//       <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
//         <div className="flex justify-between items-center">
//           <div className="text-center">
//             <motion.h2
//               initial={{ scale: 1 }}
//               animate={{ scale: timeLeft < 30 ? [1, 1.05, 1] : 1 }}
//               transition={{ duration: 1, repeat: timeLeft < 30 ? Infinity : 0 }}
//               className="text-4xl font-bold text-blue-600"
//             >
//               {Math.round(target)}
//             </motion.h2>
//             <p className="text-sm text-gray-600 dark:text-gray-400">Target</p>
//           </div>
//           <div className="text-right">
//             <p className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200">
//               {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
//             </p>
//             <p className="text-sm text-gray-600 dark:text-gray-400">Time Left</p>
//           </div>
//         </div>
//         <Progress
//           value={(timeLeft / DIFFICULTY_CONFIGS[difficulty].timeLimit) * 100}
//           className={`h-2 ${timeLeft < 30 ? 'bg-red-500' : 'bg-blue-500'}`}
//         />
//         <div className="space-y-2">
//           <input
//             ref={inputRef}
//             type="text"
//             value={userInput}
//             onChange={(e) => setUserInput(e.target.value)}
//             className="w-full p-4 text-xl font-mono border-2 border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-center focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
//             placeholder="Your solution..."
//             onKeyDown={(e) => e.key === 'Enter' && checkSolution()}
//           />
//           <motion.div
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             transition={{ duration: 0.3 }}
//             className={`text-center text-lg font-mono ${isCorrect ? 'text-green-600' : 'text-gray-500 dark:text-gray-400'}`}
//           >
//             = {liveResult}
//           </motion.div>
//         </div>
//         <div className="grid sm:grid-cols-2 gap-6">
//           <div className="space-y-4">
//             <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Numbers</p>
//             <NumberButtons numbers={numbers} usedNumbers={usedNumbers} insertAtCursor={insertAtCursor} />
//           </div>
//           <div className="space-y-4">
//             <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Operations</p>
//             <OperationButtons insertAtCursor={insertAtCursor} />
//           </div>
//         </div>
//         <div className="flex gap-4 justify-center">
//           <Button
//             onClick={checkSolution}
//             className="flex-1 h-12 bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600"
//           >
//             <Check className="w-5 h-5 mr-2" /> Check
//           </Button>
//           <Button
//             onClick={() => setMessage(solutions[0])}
//             className="flex-1 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
//           >
//             <HelpCircle className="w-5 h-5 mr-2" /> Hint
//           </Button>
//           <Button
//             onClick={() => {
//               setUserInput('');
//               inputRef.current?.focus();
//             }}
//             variant="outline"
//             className="h-12 px-6 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
//           >
//             <X className="w-5 h-5" />
//           </Button>
//         </div>
//         <AnimatePresence>
//           {message && (
//             <motion.div
//               initial={{ opacity: 0, y: 10 }}
//               animate={{ opacity: 1, y: 0 }}
//               exit={{ opacity: 0, y: 10 }}
//               className="mt-4"
//             >
//               <Alert className={message.includes('Correct') ? 'bg-green-100' : 'bg-red-100'}>
//                 <AlertDescription className="text-center">{message}</AlertDescription>
//               </Alert>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>
//     );
//   };

//   const ResultScreen = () => (
//     <motion.div
//       initial={{ opacity: 0, scale: 0.95 }}
//       animate={{ opacity: 1, scale: 1 }}
//       transition={{ duration: 0.5 }}
//       className="max-w-md mx-auto px-4 py-12"
//     >
//       <Card className="p-6 text-center space-y-6 bg-white dark:bg-gray-800 shadow-xl rounded-2xl">
//         <motion.h3
//           animate={{ scale: [1, 1.1, 1] }}
//           transition={{ duration: 1, repeat: gameState === 'SUCCESS' ? 2 : 0 }}
//           className={`text-3xl font-bold ${gameState === 'SUCCESS' ? 'text-green-600' : 'text-red-600'}`}
//         >
//           {gameState === 'SUCCESS' ? '🎉 Brilliant!' : '⏰ Time\'s Up!'}
//         </motion.h3>
//         <p className="text-gray-600 dark:text-gray-300">
//           {gameState === 'SUCCESS' ? `Solved with ${timeLeft}s left!` : 'Better luck next time!'}
//         </p>
//         <div className="grid grid-cols-2 gap-4">
//           <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
//             <p className="text-3xl font-bold text-blue-600">{score}</p>
//             <p className="text-sm text-gray-500">Round Score</p>
//           </div>
//           <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded-lg">
//             <p className="text-3xl font-bold text-blue-600">{stats.totalScore}</p>
//             <p className="text-sm text-gray-500">Total Score</p>
//           </div>
//         </div>
//         {solutions.length > 0 && (
//           <Card className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
//             <p className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-2">Example Solution</p>
//             <p className="text-lg font-mono text-gray-600 dark:text-gray-300">{solutions[0]}</p>
//           </Card>
//         )}
//         <div className="flex flex-col gap-3">
//           <Button onClick={() => startGame(difficulty)} className="h-12 bg-blue-500 hover:bg-blue-600">
//             <RefreshCw className="w-5 h-5 mr-2" /> Play Again
//           </Button>
//           <Button
//             variant="outline"
//             onClick={() => setGameState('MENU')}
//             className="h-12 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
//           >
//             Change Difficulty
//           </Button>
//           <Button variant="secondary" className="h-12 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500">
//             <Share className="w-5 h-5 mr-2" /> Share Score
//           </Button>
//         </div>
//       </Card>
//     </motion.div>
//   );

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-100 to-blue-100 dark:from-gray-900 dark:to-blue-900">
//       <GameHeader />
//       <AnimatePresence mode="wait">
//         {gameState === 'MENU' && <MenuScreen key="menu" />}
//         {gameState === 'PLAYING' && <GameScreen key="game" />}
//         {(gameState === 'SUCCESS' || gameState === 'GAME_OVER') && <ResultScreen key="result" />}
//       </AnimatePresence>

//       <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
//         <DialogContent className="rounded-xl">
//           <DialogHeader>
//             <DialogTitle>Quit Game?</DialogTitle>
//             <DialogDescription>Are you sure? Your progress will be lost.</DialogDescription>
//           </DialogHeader>
//           <DialogFooter className="flex justify-end gap-2">
//             <Button variant="outline" onClick={() => setShowQuitDialog(false)}>
//               Cancel
//             </Button>
//             <Button variant="destructive" onClick={() => { setShowQuitDialog(false); setGameState('MENU'); setScore(0); }}>
//               Quit
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
//         <DialogContent className="rounded-xl max-w-lg">
//           <DialogHeader>
//             <DialogTitle>How to Play</DialogTitle>
//             <DialogDescription className="space-y-4">
//               <p>Use any subset of the given numbers with operations to match the target.</p>
//               <div className="space-y-3">
//                 <div>
//                   <h4 className="font-semibold text-sm">Basic Operations:</h4>
//                   <p className="text-sm">+, -, *, /, ^ (exponents), ( )</p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-sm">Advanced Functions:</h4>
//                   <p className="text-sm">! (factorial), √ (square root), ∛ (cube root)</p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-sm">Multi-digit Numbers:</h4>
//                   <p className="text-sm">Combine digits to form larger numbers (e.g., if given 6,2,3 you can use 623)</p>
//                 </div>
//                 <div>
//                   <h4 className="font-semibold text-sm">Rules:</h4>
//                   <ul className="list-disc pl-4 space-y-1 text-sm">
//                     <li>Each digit can only be used once</li>
//                     <li>You don't have to use all numbers</li>
//                     <li>The target will never be one of the given numbers</li>
//                     <li>Solve within the time limit for points</li>
//                     <li>Faster solutions = more bonus points</li>
//                   </ul>
//                 </div>
//               </div>
//             </DialogDescription>
//           </DialogHeader>
//           <DialogFooter>
//             <Button onClick={() => setShowHelpDialog(false)} className="bg-blue-500 hover:bg-blue-600">
//               Got it!
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// };

// export default MathGame;



import React, { useState, useEffect, memo, useRef } from 'react';
import { evaluate } from 'mathjs';
import { motion, AnimatePresence } from 'framer-motion';
import { Calculator, RefreshCw, Check, X, ArrowLeft, Trophy, HelpCircle, Settings, Share, Star, User, TrendingUp, History, Sliders } from 'lucide-react';
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
          <motion.button
            key={i}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => !usedNumbers.includes(num) && insertAtCursor(num.toString())}
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
            <motion.button
              key={op}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => insertAtCursor(` ${op} `)}
              className="h-14 text-xl font-mono bg-gray-100 dark:bg-gray-700 rounded-lg shadow-md hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              {op}
            </motion.button>
          ))}
        </div>
      </div>
      
      {advancedOps.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Advanced Functions</p>
          <div className="grid grid-cols-2 gap-2">
            {advancedOps.map((func) => (
              <motion.button
                key={func.symbol}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => insertAtCursor(func.symbol)}
                className="h-10 text-sm font-mono bg-purple-100 dark:bg-purple-900 rounded-lg shadow-sm hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                title={func.title}
              >
                {func.display}
              </motion.button>
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

  // Load stats on mount
  useEffect(() => {
    const savedStats = JSON.parse(localStorage.getItem('mathGameOverallStats') || '{}');
    if (Object.keys(savedStats).length > 0) setOverallStats(savedStats);
  }, []);

  // Save stats when they change
  useEffect(() => {
    localStorage.setItem('mathGameOverallStats', JSON.stringify(overallStats));
  }, [overallStats]);

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
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-4 py-8 space-y-8"
    >
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
          <motion.div
            key={i}
            whileHover={{ scale: 1.05 }}
            className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-md text-center"
          >
            <div className="text-2xl mb-1">{stat.icon}</div>
            <p className="text-lg font-bold">{stat.value}</p>
            <p className="text-xs text-gray-500">{stat.label}</p>
          </motion.div>
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
              <motion.button
                key={key}
                whileHover={{ scale: isUnlocked ? 1.05 : 1 }}
                whileTap={{ scale: isUnlocked ? 0.95 : 1 }}
                onClick={() => isUnlocked && startGame(key)}
                disabled={!isUnlocked}
                className={`p-4 rounded-xl shadow-md transition-all text-left ${
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
                <div className="mt-2 flex items-center justify-between">
                  <Badge className="bg-blue-500">{concept.baseScore} pts</Badge>
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`h-3 w-3 ${i < progress ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} />
                    ))}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.div>
  );

  // Game Screen Component
  const GameScreen = () => {
    const numberMatches = userInput.match(/\d+/g) || [];
    const usedNumbers = [];
    
    numberMatches.forEach(numStr => {
      numStr.split('').forEach(digit => {
        usedNumbers.push(parseInt(digit));
      });
    });
    
    const isCorrect = liveResult !== 'Invalid' && liveResult !== '--' && Math.abs(liveResult - target) < 1e-9;
    const concept = LEVEL_CONCEPTS[currentConcept];
    
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Game Info Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
          <div className="flex justify-between items-center mb-4">
            <div className="text-center">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{concept.icon}</span>
                <h3 className="text-lg font-bold">{concept.name}</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">{concept.scientist}</p>
            </div>
            
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
            
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400"> Time Left</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200">
                {score}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
            </div>
          </div>
          <Progress value={(timeLeft / concept.timeLimit) * 100} className="h-2 bg-blue-200 dark:bg-blue-800" />
          <Alert variant="info" className="mt-4">
            <AlertDescription>
              {concept.description} • Use any subset of the numbers: {numbers.join(', ')}.
            </AlertDescription>
          </Alert>
        </div>
        {/* User Input Section */}
        <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center mb-4">
            <Calculator className="h-6 w-6 text-blue-600 dark:text-blue-400 mr-2" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Your Solution</h2>
          </div>
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder="Enter your solution here..."
            className="w-full h-24 p-3 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 resize-none"
          />
          <div className="mt-4 flex flex-wrap gap-2">
            <NumberButtons numbers={numbers} usedNumbers={usedNumbers} insertAtCursor={insertAtCursor} />
            <OperationButtons availableOps={concept.operations} insertAtCursor={insertAtCursor} />
          </div>
          <div className="mt-4 flex justify-between items-center">
            <Button onClick={checkSolution} className={`h-12 w-full ${isCorrect ? 'bg-green-500 hover:bg-green-600' : 'bg-blue-500 hover:bg-blue-600'}`}>
              {isCorrect ? <Check className="w-5 h-5 mr-2" /> : <X className="w-5 h-5 mr-2" />}
              {isCorrect ? 'Submit Solution' : 'Check Solution'}
            </Button>
            <Button variant="outline" onClick={() => setGameState('MENU')} className="h-12 w-full border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
              <ArrowLeft className="w-5 h-5 mr-2" /> Back to Menu
            </Button>
          </div>
          {message && (
            <p className={`mt-4 text-sm ${isCorrect ? 'text-green-600' : 'text-red-600'} font-semibold`}>
              {message}
            </p>
          )}
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Live Result: <span className={`font-mono ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>{liveResult}</span>
          </p>
          <div className="mt-4">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">Solutions Found:</h3>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              {solutions.map((sol, index) => (
                <li key={index} className="text-sm text-gray-700 dark:text-gray-300">
                  {sol}
                </li>
              ))}
            </ul>
          </div>
        </Card>
        {/* Game Over / Success Screen */}
        <AnimatePresence>
          {gameState === 'SUCCESS' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            >
              <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <Trophy className="h-8 w-8 text-yellow-500" />
                  <Button variant="ghost" size="icon" onClick={() => setGameState('MENU')}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Congratulations!</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">You solved the problem!</p>
                <p className="text-xl font-mono font-bold text-green-600 mb-4">{score} Points Earned</p>
                <Button onClick={() => setGameState('MENU')} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Back to Menu
                </Button>
              </Card>
            </motion.div>
          )}
          {gameState === 'GAME_OVER' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
            >
              <Card className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg max-w-md w-full">
                <div className="flex items-center justify-between mb-4">
                  <X className="h-8 w-8 text-red-500" />
                  <Button variant="ghost" size="icon" onClick={() => setGameState('MENU')}>
                    <X className="h-5 w-5" />
                  </Button>
                </div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-2">Game Over</h2>
                <p className="text-lg text-gray-600 dark:text-gray-400 mb-4">Time's up! You didn't solve the problem.</p>
                <p className="text-xl font-mono font-bold text-red-600 mb-4">Score: {score}</p>
                <Button onClick={() => setGameState('MENU')} className="w-full bg-blue-500 hover:bg-blue-600 text-white">
                  Back to Menu
                </Button>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }
  // Custom Settings Dialog
  const CustomSettingsDialog = () => (
    <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Custom Challenge Settings</DialogTitle>
          <DialogDescription>
            Create your own math challenge with custom settings.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Min Target</label>
              <input
                type="number"
                value={customSettings.minTarget}
                onChange={(e) => setCustomSettings({ ...customSettings, minTarget: Math.max(10, parseInt(e.target.value)) })}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Max Target</label>
              <input
                type="number"
                value={customSettings.maxTarget}
                onChange={(e) => setCustomSettings({ ...customSettings, maxTarget: Math.max(customSettings.minTarget + 10, parseInt(e.target.value)) })}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Number Count</label>
              <input
                type="number"
                min={3}
                max={6}
                value={customSettings.numberCount}
                onChange={(e) => setCustomSettings({ ...customSettings, numberCount: Math.max(3, Math.min(6, parseInt(e.target.value))) })}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time Limit (seconds)</label>
              <input
                type="number"
                min={60}
                max={300}
                value={customSettings.timeLimit}
                onChange={(e) => setCustomSettings({ ...customSettings, timeLimit: Math.max(60, Math.min(300, parseInt(e.target.value))) })}
                className="mt-1 block w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Operations</label>
            <Select
              value={customSettings.operations}
              onValueChange={(value) => setCustomSettings({ ...customSettings, operations: value.split(',') })}
              multiple
              className="mt-1 w-full"
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select operations" />
              </SelectTrigger>
              <SelectContent>
                {['+', '-', '*', '/', '^', 'sqrt(', 'cbrt(', '!'].map(op => (
                  <SelectItem key={op} value={op}>{op}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center mt-4">
            <Checkbox
              id="mustUseAll"
              checked={customSettings.mustUseAll}
              onCheckedChange={(checked) => setCustomSettings({ ...customSettings, mustUseAll: checked })}
            />
            <label htmlFor="mustUseAll" className="ml-2 text-sm text-gray-700 dark:text-gray-300">Must use all numbers</label>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <Button onClick={() => setShowCustomDialog(false)} variant="outline" className="mr-2">Cancel</Button>
          <Button onClick={() => {
            startGame('CUSTOM', true);
            setShowCustomDialog(false);
          }} className="bg-blue-500 hover:bg-blue-600 text-white">Start Custom Game</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  // History Dialog
  const HistoryDialog = () => (
    <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Game History</DialogTitle>
          <DialogDescription>
            Review your past games and solutions.
          </DialogDescription>
        </DialogHeader>
        {sessionStats.history.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No game history available.</p>
        ) : (
          <div className="space-y-4">
            {sessionStats.history.map((game, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 p-4 shadow-sm rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(game.timestamp).toLocaleString()}</span>
                  <span className={`text-sm font-semibold ${game.solved ? 'text-green-600' : 'text-red-600'}`}>
                    {game.solved ? 'Solved' : 'Unsolved'}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-1">Target: {game.target}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Numbers: {game.numbers.join(', ')}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Your Solution: {game.userSolution}</p>
                <p className="text-sm text-gray-700 dark:text-gray-300">Correct Solution: {game.correctSolution}</p>
                {game.solved && (
                  <p className="mt-2 text-sm font-mono font-bold text-green-600">Score: {game.score} pts</p>
                )}
              </Card>
            ))}
          </div>
        )}
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setShowHistoryDialog(false)} variant="outline">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  // Quit Confirmation Dialog
  const QuitDialog = () => (
    <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Are you sure you want to quit?</DialogTitle>
          <DialogDescription>
            Your current game progress will be lost.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setShowQuitDialog(false)} variant="outline" className="mr-2">Cancel</Button>
          <Button onClick={() => {
            setGameState('MENU');
            setShowQuitDialog(false);
          }} className="bg-red-500 hover:bg-red-600 text-white">Quit Game</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  // Help Dialog
  const HelpDialog = () => (
    <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>How to Play</DialogTitle>
          <DialogDescription>
            Learn how to solve math challenges and improve your skills.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            In Mathle, you will be given a target number and a set of numbers. Your goal is to use the available operations to reach the target number.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            You can use any combination of the numbers provided, and you must follow the rules of arithmetic. The operations available depend on the level you are playing.
          </p>
          <p className="text-gray-700 dark:text-gray-300">
            For more detailed instructions, please refer to the documentation or tutorials available online.
          </p>
        </div>
        <div className="mt-4 flex justify-end">
          <Button onClick={() => setShowHelpDialog(false)} variant="outline">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
  // Render based on game state
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <GameHeader />
      {gameState === 'MENU' && <MenuScreen />}
      {gameState === 'PLAYING' && <GameScreen />}
      <CustomSettingsDialog />
      <HistoryDialog />
      <QuitDialog />
      <HelpDialog />
      
      {/* Floating Action Button for New Math */}
      {gameState === 'MENU' && (
        <div className="fixed bottom-4 right-4">
          <NewMath insertAtCursor={insertAtCursor} />
        </div>
      )}
    </div>
  );
}