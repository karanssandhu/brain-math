import React, { useState, useEffect } from 'react';
import { Calculator, RefreshCw, Check, X, ArrowLeft, Trophy, HelpCircle, Settings, Share } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
} from "@/components/ui/dialog";

const MathGame = () => {
  const [gameState, setGameState] = useState('MENU');
  const [difficulty, setDifficulty] = useState(null);
  const [difficulties, setDifficulties] = useState([]);
  const [numbers, setNumbers] = useState([]);
  const [target, setTarget] = useState(null);
  const [userInput, setUserInput] = useState('');
  const [message, setMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);
  const [totalScore, setTotalScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showQuitDialog, setShowQuitDialog] = useState(false);
  const [showHelpDialog, setShowHelpDialog] = useState(false);

  const [solutions, setSolutions] = useState([]);

  const [gamesPlayed, setGamesPlayed] = useState(0);
  const [winRate, setWinRate] = useState(0);

  // Improved statistics tracking
  const [stats, setStats] = useState({
    gamesPlayed: 0,
    gamesWon: 0,
    totalScore: 0,
    winRate: 0,
    highScore: 0,
    streak: 0,
  });

  // clear local storage
  const clearLocalStorage = () => {
    localStorage.clear();
    setStats({
      gamesPlayed: 0,
      gamesWon: 0,
      totalScore: 0,
      winRate: 0,
      highScore: 0,
      streak: 0,
    });
  };

  // Load stats from localStorage on mount
  useEffect(() => {
    const savedStats = localStorage.getItem('mathGameStats');
    if (savedStats) {
      setStats(JSON.parse(savedStats));
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('mathGameStats', JSON.stringify(stats));
  }, [stats]);

  // Update stats when game ends
  const updateStats = (won, scoreToAdd = 0) => {
    setStats((prev) => {
      const gamesPlayed = prev.gamesPlayed + 1;
      const gamesWon = won ? prev.gamesWon + 1 : prev.gamesWon;
      const newStats = {
        gamesPlayed,
        gamesWon,
        totalScore: prev.totalScore + scoreToAdd,
        highScore: Math.max(prev.highScore, scoreToAdd),
        streak: won ? prev.streak + 1 : 0,
        winRate: ((gamesWon / gamesPlayed) * 100).toFixed(1), // Correct win rate calculation
      };
      return newStats;
    });
  };


  // Fetch difficulties on mount
  useEffect(() => {
    const fetchDifficulties = async () => {
      try {
        const response = await fetch('/api/math-game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'GET_DIFFICULTIES' })
        });
        const data = await response.json();
        setDifficulties(data.difficulties);
      } catch (error) {
        console.error('Failed to fetch difficulties:', error);
      }
    };
    fetchDifficulties();

    // fetch games played and win rate
    const gamesPlayed = localStorage.getItem('gamesPlayed');
    const winRate = localStorage.getItem('winRate');
    setGamesPlayed(gamesPlayed || 0);
    setWinRate(winRate || 0);

    if (gamesPlayed) {
      setGamesPlayed(parseInt(gamesPlayed));
    }

    if (winRate == 'NaN') {
      setWinRate(0);
    }

    console.log('gamesPlayed:', gamesPlayed);
    console.log('winRate:', winRate);
  }, []);


  // save the games played and winrate to local storage
  useEffect(() => {
    localStorage.setItem('gamesPlayed', gamesPlayed);
    localStorage.setItem('winRate', winRate);
  }, [gamesPlayed, winRate]);





  const startGame = async (selectedDifficulty) => {
    setLoading(true);
    try {
      const response = await fetch('/api/math-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'START_GAME',
          difficulty: selectedDifficulty
        })
      });

      const data = await response.json();
      if (response.ok) {
        setDifficulty(selectedDifficulty);
        setNumbers(data.numbers);
        setTarget(data.target);
        setTimeLeft(data.timeLimit);
        setGameState('PLAYING');
        setUserInput('');
        setMessage('');
        updateStats(false);

      } else {
        setMessage('Failed to start game: ' + data.error);
      }
    } catch (error) {
      setMessage('Error starting game: ' + error.message);
    } finally {
      setLoading(false);
    }
  };


  const getSolutions = async () => {
    try {
      // wait for number and target to initialize
      if (!numbers.length || !target) {
        return;
      }
      const response = await fetch('/api/math-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'GET_SOLUTIONS',
          numbers,
          target
        })
      });
      const data = await response.json();
      setSolutions(data.solutions);
    } catch (error) {
      console.error('Failed to get solutions:', error);
    }
  };

  const checkSolution = async () => {
    if (!userInput.trim()) {
      setMessage('Please enter a solution');
      return;
    }

    try {
      const response = await fetch('/api/math-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'CHECK_SOLUTION',
          expression: userInput,
          numbers,
          target,
          difficulty,
          timeLeft
        })
      });

      const data = await response.json();
      setMessage(data.message);

      if (data.valid) {
        setScore(data.score);
        setTotalScore(prev => prev + data.score);
        setGameState('SUCCESS');
        updateStats(true, data.score);
      }
    } catch (error) {
      setMessage('Error checking solution: ' + error.message);
      updateStats(false);
    }
  };

  const quitGame = () => {
    setShowQuitDialog(true);
  };

  const confirmQuit = () => {
    setShowQuitDialog(false);
    setGameState('MENU');
    setDifficulty(null);
    setScore(0);
    setWinRate(((totalScore / gamesPlayed) * 100).toFixed(2));
  };

  // Timer effect
  useEffect(() => {
    let timer;
    if (gameState === 'PLAYING' && timeLeft > 0) {
      timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    } else if (timeLeft === 0 && gameState === 'PLAYING') {
      setGameState('GAME_OVER');
      setMessage('Time is up!');
      setWinRate(((totalScore / gamesPlayed) * 100).toFixed(2));
    }
    return () => clearInterval(timer);
  }, [timeLeft, gameState]);

  const DifficultySelector = () => (
    <div className="grid gap-4">
      {difficulties.map((diff) => (
        <Button
          key={diff.id}
          onClick={() => startGame(diff.id)}
          className="w-full justify-between"
          disabled={loading}
        >
          <div className="flex flex-col items-start">
            <span className="font-bold">{diff.id.charAt(0) + diff.id.slice(1).toLowerCase()}</span>
            <span className="text-sm text-gray-500">{diff.description}</span>
          </div>
          <Badge variant="secondary">
            {diff.baseScore} pts
          </Badge>
        </Button>
      ))}
    </div>
  );

  const GameHeader = () => (
    <div className="border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-4xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setShowQuitDialog(true)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          {/* <Button variant="ghost" size="icon" onClick={clearLocalStorage}>
            <Trophy className="h-5 w-5" />
          </Button> */}
          
          <h1 className="text-2xl font-bold tracking-tight">MATHLE</h1>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={() => setShowHelpDialog(true)}>
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  const StatsBadge = ({ icon: Icon, label, value, description }) => (
    <div className="flex flex-col items-center bg-gray-100 dark:bg-gray-800 rounded-lg p-3 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors">
      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <span className="text-2xl font-bold">{value}</span>
      {description && (
        <span className="text-xs text-gray-500 mt-1">{description}</span>
      )}
    </div>
  );

  const MenuScreen = () => (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-4xl font-bold tracking-tight">Welcome to Mathle</h2>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          A daily mathematical puzzle game
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatsBadge
          icon={Trophy}
          label="Total Score"
          value={stats.totalScore}
          description="All-time points"
        />
        <StatsBadge
          icon={Calculator}
          label="Games Won"
          value={stats.gamesWon}
          description={`${stats.gamesPlayed} played`}
        />
        <StatsBadge
          icon={RefreshCw}
          label="Win Rate"
          value={`${stats.winRate}%`}
          description={`${stats.streak} streak`}
        />
      </div>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Select Difficulty</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {difficulties.map((diff) => (
            <Button
              key={diff.id}
              onClick={() => startGame(diff.id)}
              className="w-full h-auto py-4 justify-between hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              variant="outline"
              disabled={loading}
            >
              <div className="flex flex-col items-start">
                <span className="text-lg font-bold">
                  {diff.id.charAt(0) + diff.id.slice(1).toLowerCase()}
                </span>
                <span className="text-sm text-gray-500">{diff.description}</span>
              </div>
              <Badge variant="secondary" className="text-lg">
                {diff.baseScore}
              </Badge>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );

  const GameScreen = () => (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h2 className="text-3xl font-bold">{target}</h2>
          <p className="text-gray-500">Target Number</p>
        </div>
        <div className="text-right">
          <div className="text-2xl font-mono font-bold">
            {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
          </div>
          <p className="text-gray-500">Time Remaining</p>
        </div>
      </div>

      <Progress
        value={(timeLeft / difficulties.find(d => d.id === difficulty)?.timeLimit) * 100}
        className="h-2"
      />

      <div className="grid gap-6">
        <div className="relative">
          <input
            type="text"
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            className="w-full p-4 md:p-6 text-xl md:text-2xl font-mono border rounded-lg bg-white dark:bg-gray-800 text-center"
            placeholder="Enter your solution..."
            onKeyDown={(e) => e.key === 'Enter' && checkSolution()}
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-500">Numbers</div>
            <div className="grid grid-cols-3 gap-2">
              {numbers.map((num, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="h-14 md:h-16 text-xl md:text-2xl font-bold"
                  onClick={() => setUserInput(userInput + num)}
                >
                  {num}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-500">Operations</div>
            <div className="grid grid-cols-3 gap-2">
              {['+', '-', '*', '/', '(', ')'].map(op => (
                <Button
                  key={op}
                  variant="secondary"
                  className="h-14 md:h-16 text-xl md:text-2xl font-mono"
                  onClick={() => setUserInput(userInput + ` ${op} `)}
                >
                  {op}
                </Button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            className="flex-1 h-14 text-lg"
            onClick={checkSolution}
          >
            <Check className="w-5 h-5 mr-2" />
            Check
          </Button>
          <Button
            className="flex-1 h-14 text-lg"
            onClick={() => {
              getSolutions();
              setMessage(solutions[0]);
            }}
          >
            <HelpCircle className="w-5 h-5 mr-2" />
            Hint
          </Button>
          <Button
            variant="outline"
            className="h-14 px-6"
            onClick={() => setUserInput('')}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {message && (
        <Alert className="mt-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}
    </div>
  );

  const ResultScreen = () => (
    <div className="max-w-md mx-auto px-4 py-8">
      <Card className="p-6 text-center space-y-6">
        <div className="space-y-2">
          <h3 className="text-2xl font-bold">
            {gameState === 'SUCCESS' ? '🎉 Brilliant!' : '⏰ Time is Up!'}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {gameState === 'SUCCESS'
              ? `You solved it with ${timeLeft} seconds remaining!`
              : 'Better luck next time!'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-3xl font-bold">{score}</div>
            <div className="text-sm text-gray-500">Round Score</div>
          </div>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded-lg">
            <div className="text-3xl font-bold">{stats.totalScore}</div>
            <div className="text-sm text-gray-500">Total Score</div>
          </div>
        </div>

        {solutions.length > 0 && (
          <Card className="p-4">
            <div className="text-lg font-bold mb-2">Solutions</div>
            <div className="space-y-2">
              {solutions.slice(0, 3).map((sol, i) => (
                <div key={i} className="text-lg font-mono p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  {sol}
                </div>
              ))}
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          <Button onClick={() => startGame(difficulty)} className="h-12">
            <RefreshCw className="w-5 h-5 mr-2" />
            Play Again
          </Button>
          <Button variant="outline" onClick={() => setGameState('MENU')} className="h-12">
            Change Difficulty
          </Button>
          <Button variant="secondary" className="h-12">
            <Share className="w-5 h-5 mr-2" />
            Share Score
          </Button>
        </div>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <GameHeader />

      {gameState === 'MENU' && <MenuScreen />}
      {gameState === 'PLAYING' && <GameScreen />}
      {(gameState === 'SUCCESS' || gameState === 'GAME_OVER') && <ResultScreen />}

      <Dialog open={showQuitDialog} onOpenChange={setShowQuitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Quit Game?</DialogTitle>
            <DialogDescription>
              Are you sure you want to quit? Your progress in this round will be lost.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowQuitDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmQuit}>
              Quit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showHelpDialog} onOpenChange={setShowHelpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>How to Play</DialogTitle>
            <DialogDescription className="space-y-4">
              <p>
                Use the given numbers and basic math operations (+, -, *, /) to create an expression that equals the target number.
              </p>
              <ul className="list-disc pl-4 space-y-2">
                <li>Each number can only be used once</li>
                <li>You must use proper mathematical notation</li>
                <li>Solve within the time limit to earn points</li>
                <li>Faster solutions earn more points</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowHelpDialog(false)}>
              Got it!
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MathGame;

