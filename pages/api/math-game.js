// api/math-game.js
import { solveMathGame } from "@/lib/aiMathSolver";
import { generateAIPuzzle } from "@/lib/aiMathGame";

const DIFFICULTY_CONFIGS = {
  // change the level name to scientific
  BEGINNER: {
    numberCount: 5,
    maxNumber: 9,
    timeLimit: 120,
    baseScore: 100,
    description: "Combine numbers creatively",
    targetRange: { min: 10, max: 199 }
  },
  INTERMEDIATE: {
    numberCount: 6,
    maxNumber: 9,
    timeLimit: 180,
    baseScore: 200,
    description: "More numbers, more possibilities",
    targetRange: { min: 100, max: 299 }
  },
  ADVANCED: {
    numberCount: 4,
    maxNumber: 9,
    timeLimit: 240,
    baseScore: 300,
    description: "Complex combinations",
    targetRange: { min: 100, max: 399 }
  },
  SUPER_ADVANCED: {
    numberCount: 4,
    maxNumber: 9,
    timeLimit: 240,
    baseScore: 300,
    description: "Complex combinations",
    targetRange: { min: 100, max: 499 }
  }
};

// // Helper to generate unique numbers and ensure at least one solution exists
// const generateGameNumbers = (config) => {
//   let numbers, target, solutions;
//   let attempts = 0;
//   const maxAttempts = 100;

//   while (attempts < maxAttempts) {
//     // Generate target number within difficulty range
//     target = Math.floor(
//       Math.random() * (config.targetRange.max - config.targetRange.min + 1)
//     ) + config.targetRange.min;

//     // Generate unique numbers
//     const availableNumbers = Array.from({ length: 9 }, (_, i) => i + 1);
//     numbers = [];
    
//     while (numbers.length < config.numberCount) {
//       const randomIndex = Math.floor(Math.random() * availableNumbers.length);
//       numbers.push(availableNumbers[randomIndex]);
//       availableNumbers.splice(randomIndex, 1);
//     }

//     // Check if there's at least one solution
    
//     solutions = solveMathGame(numbers, target);


    
//     if (solutions.length > 0) {
//       return { numbers, target, solutions };
//     }

//     attempts++;
//   }

//   throw new Error('Could not generate valid game configuration');
// };

// Modified expression validator
const validateMathExpression = (expr, allowedNumbers) => {
  try {
    // Basic syntax validation
    if (!/^[\d\s\+\-\*\/\(\)]*$/.test(expr)) {
      return false;
    }

    // Check parentheses balance
    let parenCount = 0;
    for (const char of expr) {
      if (char === '(') parenCount++;
      if (char === ')') parenCount--;
      if (parenCount < 0) return false;
    }
    if (parenCount !== 0) return false;

    // Verify only allowed numbers are used
    const numbersInExpression = expr.match(/\d+/g)?.map(Number) || [];
    const numbersValid = numbersInExpression.every(num => allowedNumbers.includes(num));
    if (!numbersValid) return false;

    return true;
  } catch {
    return false;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { action } = req.body;

  switch (action) {
    case 'GET_SOLUTIONS': {
      const { numbers, target } = req.body;
      const solutions = solveMathGame(numbers, target);
      return res.status(200).json({ solutions });
    }

    case 'GET_DIFFICULTIES': {
      return res.status(200).json({
        difficulties: Object.entries(DIFFICULTY_CONFIGS).map(([key, config]) => ({
          id: key,
          ...config
        }))
      });
    }

    case 'START_GAME': {
      try {
        const { difficulty } = req.body;
        const config = DIFFICULTY_CONFIGS[difficulty];

        if (!config) {
          return res.status(400).json({ error: 'Invalid difficulty' });
        }

        // const { numbers, target, solutions } = generateGameNumbers(config);
        const { numbers, target, solutions } = await generateAIPuzzle(config.numberCount, config.targetRange.min, config.targetRange.max);

        return res.status(200).json({
          numbers,
          target,
          timeLimit: config.timeLimit,
          baseScore: config.baseScore,
          operations: ['+', '-', '*', '/', '(', ')'],
        });
      } catch (error) {
        return res.status(500).json({ error: error.message });
      }
    }

    case 'CHECK_SOLUTION': {
      const { expression, numbers, target, difficulty, timeLeft } = req.body;
      const config = DIFFICULTY_CONFIGS[difficulty];

      if (!validateMathExpression(expression, numbers)) {
        return res.status(400).json({
          valid: false,
          message: 'Invalid mathematical expression or numbers not allowed'
        });
      }

      try {
        const result = eval(expression);

        // Calculate score based on difficulty and time left
        const timeBonus = Math.floor(timeLeft * (config.baseScore / config.timeLimit));
        const score = result === target ? config.baseScore + timeBonus : 0;

        return res.status(200).json({
          valid: result === target,
          score,
          message: result === target
            ? `Correct solution! You earned ${score} points!`
            : 'Incorrect solution. Try again!'
        });
      } catch {
        return res.status(400).json({
          valid: false,
          message: 'Invalid expression'
        });
      }
    }

    default:
      return res.status(400).json({ error: 'Invalid action' });
  }
}