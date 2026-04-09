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

export const MODEL_NAME = 'gemini-2.5-flash';
export const FALLBACK_MODEL_NAME = 'gemini-2.0-flash';

function shouldTryFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /503|429|high demand|service unavailable|overloaded|not found/i.test(message);
}

export async function generateContent(prompt: string, systemInstructions?: string) {
  const modelCandidates = [MODEL_NAME, FALLBACK_MODEL_NAME];

  try {
    const geminiClient = getGeminiClient();
    let lastError: unknown;

    for (const modelName of modelCandidates) {
      try {
        const model = geminiClient.getGenerativeModel({ model: modelName });

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
        lastError = error;
        if (!shouldTryFallback(error) || modelName === FALLBACK_MODEL_NAME) {
          throw error;
        }
      }
    }

    throw lastError;
  } catch (error) {
    console.error('Erro ao chamar Gemini:', error);
    throw error;
  }
}
