import { GoogleGenerativeAI } from '@google/generative-ai';

let cachedClient: GoogleGenerativeAI | null = null;

function getGeminiClient(): GoogleGenerativeAI {
  if (!cachedClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    cachedClient = new GoogleGenerativeAI(apiKey);
  }
  return cachedClient;
}

export const MODEL_NAME = 'gemini-1.5-flash';

export async function generateContent(prompt: string, systemInstructions?: string) {
  try {
    const geminiClient = getGeminiClient();
    const model = geminiClient.getGenerativeModel({ model: MODEL_NAME });

    const response = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      systemInstruction: systemInstructions,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
      },
    });

    const text = response.response.text();
    return text;
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    throw error;
  }
}
