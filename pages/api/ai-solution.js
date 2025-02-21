import { supabase } from '@/utils/supabaseClient';
import { HfInference } from "@huggingface/inference";

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    const { numbers, target } = req.body;

    if (!numbers || !target) {
        return res.status(400).json({ error: 'Missing numbers or target' });
    }
    try {



        // Construct prompt
        const prompt = constructPrompt(numbers, target);

        // Get solution from AI
        const solutions = await getAnalysis(prompt);


        res.status(200).json({ response: solutions });

    } catch (error) {
        console.error('Error in math game solver:', error);
        res.status(500).json({ error: error.message });

    }
}

function constructPrompt(numbers, target) {
    const promptParts = [
        `You are a math game solution generator. I will give you numbers and a target value.
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

            Numbers: ${numbers}
            Target: ${target}\n`
    ];

    return promptParts.join('\n');
}

async function getAnalysis(prompt) {
    const inference = new HfInference(process.env.HUGGING_CHAT_API);

    try {
        // Using text generation instead of chat completion
        const response = await inference.textGeneration({
            model: "mistralai/Mixtral-8x7B-Instruct-v0.1",  // Using a different model that supports text generation
            inputs: prompt,
            parameters: {
                max_new_tokens: 1500,
                temperature: 0.7,
                top_p: 0.95,
                return_full_text: false
            }
        });

        console.log('Analysis generated:', response);

        return response.generated_text || 'No analysis generated';

    } catch (error) {
        console.error('Hugging Face API Error:', error);
        throw new Error(`Analysis generation failed: ${error.message}`);
    }
}