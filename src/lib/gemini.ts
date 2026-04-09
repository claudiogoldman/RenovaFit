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
export const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL || 'openrouter/free';

function shouldTryFallback(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /503|429|high demand|service unavailable|overloaded|not found/i.test(message);
}

async function generateWithOpenRouter(prompt: string, systemInstructions?: string): Promise<string> {
  const openRouterApiKey = process.env.OPENROUTER_API_KEY;
  if (!openRouterApiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;
  if (systemInstructions) {
    messages.push({ role: 'system', content: systemInstructions });
  }
  messages.push({ role: 'user', content: prompt });

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterApiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.OPENROUTER_HTTP_REFERER || 'https://renovafit.vercel.app',
      'X-Title': process.env.OPENROUTER_APP_NAME || 'RenovaFit',
    },
    body: JSON.stringify({
      model: OPENROUTER_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2048,
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `OpenRouter request failed with status ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error('OpenRouter returned an empty response');
  }

  return content;
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

    if (shouldTryFallback(error) && process.env.OPENROUTER_API_KEY) {
      try {
        return await generateWithOpenRouter(prompt, systemInstructions);
      } catch (openRouterError) {
        console.error('Erro ao chamar OpenRouter:', openRouterError);
        throw openRouterError;
      }
    }

    throw error;
  }
}
