// lib/mathGameSolver.js

// Fast evaluation using Function constructor
const safeEval = (expr) => {
  try {
    const fn = new Function(`return ${expr.replace(/×/g, '*').replace(/÷/g, '/')}`);
    const result = fn();
    return Number.isFinite(result) ? result : null;
  } catch {
    return null;
  }
};

// Quick check if numbers can possibly reach target
const isPossibleToReachTarget = (numbers, target) => {
  const sum = numbers.reduce((a, b) => a + b, 0);
  const product = numbers.reduce((a, b) => a * b, 1);
  return target <= product && target >= -sum;
};

// Generate optimized combinations with early pruning
const generateCombinations = (numbers, target) => {
  const combinations = [];
  const seen = new Set();
  const maxDigits = target.toString().length + 1;

  const backtrack = (current, remaining) => {
    const key = current.sort().join(',');
    if (seen.has(key)) return;
    seen.add(key);

    if (current.length > 0) {
      combinations.push([...current]);
    }

    for (let i = 0; i < remaining.length; i++) {
      // Skip duplicates
      if (i > 0 && remaining[i] === remaining[i - 1]) continue;

      const num = remaining[i];
      const newCurrent = [...current, num];
      
      // Early pruning based on target
      if (!isPossibleToReachTarget(newCurrent, target)) continue;

      // Try concatenation if it makes sense
      if (i < remaining.length - 1) {
        const nextNum = remaining[i + 1];
        const concatenated = parseInt(`${num}${nextNum}`);
        if (concatenated.toString().length <= maxDigits) {
          backtrack(
            [...current, concatenated],
            [...remaining.slice(0, i), ...remaining.slice(i + 2)]
          );
        }
      }

      backtrack(
        newCurrent,
        [...remaining.slice(0, i), ...remaining.slice(i + 1)]
      );
    }
  };

  backtrack([], numbers.sort((a, b) => a - b));
  return combinations;
};

// Optimized expression generation with smart pruning
const generateExpressions = (numbers) => {
  if (numbers.length === 1) return [numbers[0].toString()];
  
  const results = new Set();
  const operators = ['+', '-', '*', '/'];
  
  for (let i = 1; i < numbers.length; i++) {
    const leftPart = numbers.slice(0, i);
    const rightPart = numbers.slice(i);
    
    const leftExpr = generateExpressions(leftPart);
    const rightExpr = generateExpressions(rightPart);
    
    for (const left of leftExpr) {
      const leftVal = safeEval(left);
      if (leftVal === null) continue;
      
      for (const right of rightExpr) {
        const rightVal = safeEval(right);
        if (rightVal === null) continue;
        
        for (const op of operators) {
          // Skip unnecessary operations
          if (op === '+' && (leftVal === 0 || rightVal === 0)) continue;
          if (op === '*' && (leftVal === 1 || rightVal === 1)) continue;
          if (op === '/' && (rightVal === 1 || rightVal === 0)) continue;
          
          // Add parentheses only when needed
          const needLeftParen = left.includes('+') || left.includes('-');
          const needRightParen = right.includes('+') || right.includes('-') || 
                                ((op === '/' || op === '-') && (right.includes('*') || right.includes('/')));
          
          const expr = `${needLeftParen ? '(' : ''}${left}${needLeftParen ? ')' : ''} ${op} ${needRightParen ? '(' : ''}${right}${needRightParen ? ')' : ''}`;
          results.add(expr);
        }
      }
    }
  }
  
  return Array.from(results);
};

// Main solver function with optimizations
export const solveMathGame = (numbers, target) => {
  // Quick validation
  if (!numbers?.length || typeof target !== 'number') return [];
  
  // Early exit if target is impossible to reach
  if (!isPossibleToReachTarget(numbers, target)) return [];
  
  const solutions = new Set();
  const tolerance = 0.001;
  
  // Use timeout to prevent long-running calculations
  return new Promise((resolve) => {
    const timeoutId = setTimeout(() => resolve([]), 2000);
    
    try {
      const combinations = generateCombinations(numbers, target);
      
      for (const combination of combinations) {
        if (solutions.size >= 3) break;
        
        const expressions = generateExpressions(combination);
        
        for (const expr of expressions) {
          if (solutions.size >= 3) break;
          
          const result = safeEval(expr);
          if (result !== null && Math.abs(result - target) < tolerance) {
            solutions.add(expr);
          }
        }
      }
      
      clearTimeout(timeoutId);
      resolve(Array.from(solutions));
    } catch (error) {
      console.error('Error in solver:', error);
      clearTimeout(timeoutId);
      resolve([]);
    }
  });
};