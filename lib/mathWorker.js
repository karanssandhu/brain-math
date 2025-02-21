// Cache for memoization
const resultCache = new Map();

// Faster evaluation using Function constructor
const safeEval = (expr) => {
  try {
    return Function('"use strict"; return (' + expr + ')')();
  } catch {
    return null;
  }
};

// Generate expressions using iteration instead of recursion
function* generateExpressions(numbers) {
  const operators = ['+', '-', '*', '/'];

  if (numbers.length > 4) return; // Skip if the combination is too large

  const queue = [{
    expr: numbers[0].toString(),
    used: [0],
    result: numbers[0]
  }];

  for (const item of queue) {
    yield item.expr;

    if (item.used.length === numbers.length) continue;

    for (let i = 0; i < numbers.length; i++) {
      if (item.used.includes(i)) continue;

      for (const op of operators) {
        const newExpr = `(${item.expr}) ${op} ${numbers[i]}`;
        const result = safeEval(newExpr);

        if (result !== null && Number.isFinite(result)) {
          queue.push({
            expr: newExpr,
            used: [...item.used, i],
            result
          });
        }
      }
    }
  }
}

// Find solutions with early termination
function findSolutions(numbers, target, tolerance = 0.001) {
  const cacheKey = `${numbers.sort().join(',')}_${target}`;
  if (resultCache.has(cacheKey)) {
    return resultCache.get(cacheKey);
  }

  const solutions = new Set();
  const seen = new Set();

  const stack = [[[], numbers]]; // Generate combinations iteratively

  while (stack.length && solutions.size < 10) {
    const [current, remaining] = stack.pop();

    if (current.length >= 2) {
      const key = [...current].sort().join(',');
      if (!seen.has(key)) {
        seen.add(key);

        for (const expr of generateExpressions(current)) {
          const result = safeEval(expr);
          if (result !== null && Math.abs(result - target) < tolerance) {
            solutions.add(expr);
            if (solutions.size >= 10) break;
          }
        }
      }
    }

    for (let i = 0; i < remaining.length; i++) {
      stack.push([
        [...current, remaining[i]],
        [...remaining.slice(0, i), ...remaining.slice(i + 1)]
      ]);
    }
  }

  const solutionsArray = Array.from(solutions);
  resultCache.set(cacheKey, solutionsArray);
  return solutionsArray;
}

// Handle messages from the main thread
self.onmessage = function (e) {
  const { numbers, target } = e.data;
  const solutions = findSolutions(numbers, target);
  self.postMessage(solutions);
};
