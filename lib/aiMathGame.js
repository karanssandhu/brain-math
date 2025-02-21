import { HfInference } from "@huggingface/inference";

export async function generateAIPuzzle(number, minTarget, maxTarget) {
    const prompt = `
            You are a math game generator. You will give ${number} random numbers and a target value.
            Your task is to find mathematical expressions using these numbers that equal the target value as hints for the user.
            Only generate one puzzle.

            Rules:
            1. Use only the provided numbers
            2. Each number can be used only once
            3. Use only these operators: +, -, *, /
            4. You can use parentheses ( )
            5. Numbers can be combined by placing them next to each other (e.g., if given 1,2 you can make 12)

            You need to provide ${number} random numbers for this puzzle between 1 and 9.
            And the target value should be between ${minTarget} and ${maxTarget}.

            For example:
            Your response should look like this:
            NUMBER_START
            2
            4
            7
            8
            NUMBER_END
            TARGET_START
            49
            TARGET_END
            SOLUTION_START
            47 + 2
            SOLUTION_END

            Always format your response exactly like this:
            NUMBER_START
            number1
            number2
            number3
            NUMBER_END
            TARGET_START
            target
            TARGET_END
            SOLUTION_START
            expression1
            expression2
            expression3
            SOLUTION_END

            Only include valid solutions between these markers. Do not include any other text.
            Maximum 3 solutions.
    `;

    const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

    try {
        const response = await hf.textGeneration({
            model: process.env.HUGGINGFACE_MODEL,
            inputs: prompt,
            parameters: {
                max_new_tokens: 300,
                temperature: 0.7,
                top_p: 0.95,
                return_full_text: false
            }
        });

        if (!response || !response.generated_text) {
            throw new Error('Invalid response from HuggingFace API');
        }

        return parsePuzzle(response.generated_text);

    } catch (error) {
        console.error('AI puzzle generation error:', error);
        throw error;
    }
}

function parsePuzzle(generatedText) {
    const text = generatedText.trim();
    console.log('Generated text:', text);
    
    // Split the text by the separator and take only the first puzzle
    const puzzles = text.split('-----------------------------------------------------------------------------------------------------------');
    const firstPuzzle = puzzles[0].trim();
    
    // Extract numbers, target and solutions using regex
    const numberMatch = firstPuzzle.match(/NUMBER_START\n([\d\n]+)NUMBER_END/);
    const targetMatch = firstPuzzle.match(/TARGET_START\n(\d+)\nTARGET_END/);
    const solutionMatch = firstPuzzle.match(/SOLUTION_START\n((.|\n)*?)SOLUTION_END/);

    if (!numberMatch || !targetMatch || !solutionMatch) {
        throw new Error('Invalid generation format');
    }

    const numbers = numberMatch[1]
        .trim()
        .split('\n')
        .map(num => Number(num.trim()))
        .filter(num => !isNaN(num));

    const target = Number(targetMatch[1]);
    
    // Only take solutions up to the next section or end of text
    const solutions = solutionMatch[1]
        .trim()
        .split('\n')
        .map(sol => sol.trim())
        .filter(sol => sol && !sol.includes('NUMBER_START') && !sol.includes('TARGET_START'));

    // Validate the parsed data
    if (numbers.length === 0 || isNaN(target) || solutions.length === 0) {
        throw new Error('Invalid data in generated puzzle');
    }

    // Take only the first 3 solutions
    const finalSolutions = solutions.slice(0, 3);

    return {
        numbers,
        target,
        solutions: finalSolutions
    };
}