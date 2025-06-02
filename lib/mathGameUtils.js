// mathGameUtils.js
export const LEVEL_CONCEPTS = {
    NEWTON: {
      name: "Newton's Basics",
      scientist: "Isaac Newton",
      description: "Simple arithmetic operations",
      icon: "🍎",
      color: "from-emerald-500 to-teal-600",
      operations: ['+', '-', '*', '/'],
      minNumbers: 3,
      maxNumbers: 4,
      targetRange: { min: 10, max: 50 },
      timeLimit: 120,
      baseScore: 100,
      mustUseAll: false,
    },
    // ... other concepts
    CUSTOM: {
      name: "Custom Challenge",
      scientist: "Your Rules",
      description: "Create your own difficulty",
      icon: "⚙️",
      color: "from-gray-500 to-slate-600",
      operations: ['+', '-', '*', '/', '^', 'sqrt(', 'cbrt(', '!'],
      minNumbers: 3,
      maxNumbers: 6,
      targetRange: { min: 10, max: 500 },
      timeLimit: 180,
      baseScore: 100,
      mustUseAll: false,
    },
  };
  
  export const generateUniqueNumbers = (count, excludeTarget = null) => {
    const numbers = new Set();
    while (numbers.size < count) {
      const num = Math.floor(Math.random() * 10);
      if (num !== excludeTarget) {
        numbers.add(num);
      }
    }
    return Array.from(numbers);
  };
  
  export const adjustDifficultyForSession = (concept, sessionStats) => {
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
  
  export const generateRandomExpression = (numbers, availableOps, mustUseAll = false) => {
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
  
  export const evaluateExpression = (expr) => {
    let processedExpr = expr
      .replace(/sqrt\(/g, 'sqrt(')
      .replace(/cbrt\(/g, 'nthRoot(')
      .replace(/!/g, ' factorial ')
      .replace(/\^/g, '^');
  
    processedExpr = processedExpr.replace(/cbrt\(([^)]+)\)/g, 'nthRoot($1, 3)');
  
    return evaluate(processedExpr);
  };