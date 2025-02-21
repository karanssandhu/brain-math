// lib/aiMathSolver.js
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

// Cache for AI-generated solutions
const solutionsCache = new Map();

// Function to generate a cache key
const getCacheKey = (numbers, target) => `${numbers.sort().join(',')}-${target}`;

// Function to get AI-generated solutions
async function getAISolutions(numbers, target) {
    const prompt = `
        You are a math game solution generator. I will give you numbers and a target value.
            Your task is to find mathematical expressions using these numbers that equal the target value.

            Rules:
            1. Use only the provided numbers
            2. Each number can be used only once
            3. Use only these operators: +, -, *, /
            4. You can use parentheses ( )
            5. Numbers cannot be combined by placing them next to each other (e.g., if given 1,2 you cannot make 12)

            Always format your response exactly like this:
            SOLUTION_START
            expression1
            expression2
            expression3
            SOLUTION_END

            Only include valid solutions between these markers. Do not include any other text.
            Maximum 3 solutions.

            Numbers: [${numbers.join(', ')}]
            Target: ${target}
    `;

    try {
        const response = await hf.textGeneration({
            model: process.env.HUGGINGFACE_MODEL,
            inputs: prompt,
            parameters: {
                max_new_tokens: 100,
                temperature: 0.3,
                top_p: 0.9,
                repetition_penalty: 1.2
            }
        });

        // Extract the expression from the response
        const expression = parseSolutions(response.generated_text)[0];
        console.log('AI solution:', expression);
        return expression ? [expression] : [];
    } catch (error) {
        console.error('AI solution generation error:', error);
        return [];
    }
}

function parseSolutions(aiResponse) {
    try {
      const match = aiResponse.match(/SOLUTION_START\n([\s\S]*?)SOLUTION_END/);
      if (!match) return [];
      
      const solutionsText = match[1].trim();
      if (!solutionsText) return [];
      
      return solutionsText
        .split('\n')
        .map(sol => sol.trim())
        .filter(sol => sol.length > 0);
    } catch (error) {
      console.error('Error parsing solutions:', error);
      return [];
    }
  }

// Modified solver function that combines AI and algorithmic approaches
export const solveMathGame = async (numbers, target) => {
    // Check cache first
    const cacheKey = getCacheKey(numbers, target);
    if (solutionsCache.has(cacheKey)) {
        return solutionsCache.get(cacheKey);
    }

    // Start both AI and algorithmic solutions in parallel
    const [aiSolutions] = await Promise.all([
        getAISolutions(numbers, target),
        // originalSolveMathGame(numbers, target)  // Your existing solver function
    ]);

    console.log('AI solutions:', aiSolutions);

    // Combine and validate solutions
    const allSolutions = new Set([...aiSolutions]);
    const validSolutions = Array.from(allSolutions).filter(expr => {
        try {
            const result = eval(expr);
            return Math.abs(result - target) < 0.001;
        } catch {
            return false;
        }
    });

    // Cache the results
    solutionsCache.set(cacheKey, validSolutions);

    return validSolutions.slice(0, 3); // Return up to 3 solutions
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

const safeEval = (expr) => {
    try {
        const fn = new Function(`return ${expr.replace(/×/g, '*').replace(/÷/g, '/')}`);
        const result = fn();
        return Number.isFinite(result) ? result : null;
    } catch {
        return null;
    }
};


// Original algorithmic solver (keep your existing implementation)
const originalSolveMathGame = async (numbers, target) => {
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