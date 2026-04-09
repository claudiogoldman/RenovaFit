export type GeminiErrorPayload = {
  status: number;
  error: string;
  details: string;
};

export function mapGeminiError(error: unknown, defaultMessage: string): GeminiErrorPayload {
  const details = error instanceof Error ? error.message : 'Erro desconhecido';
  const normalized = details.toLowerCase();

  if (normalized.includes('quota exceeded') || normalized.includes('too many requests')) {
    return {
      status: 429,
      error: 'Cota do Gemini excedida',
      details:
        'A chave do Gemini está sem cota disponível. Verifique faturamento/plano no Google AI Studio e tente novamente.',
    };
  }

  if (normalized.includes('service unavailable') || normalized.includes('high demand')) {
    return {
      status: 503,
      error: 'Gemini temporariamente indisponível',
      details: 'Alta demanda momentânea no Gemini. Aguarde alguns segundos e tente novamente.',
    };
  }

  if (normalized.includes('api_key') || normalized.includes('api key')) {
    return {
      status: 500,
      error: 'Configuração de chave Gemini inválida',
      details: 'A variável GEMINI_API_KEY não está válida. Revise a chave no Vercel.',
    };
  }

  return {
    status: 500,
    error: defaultMessage,
    details,
  };
}
