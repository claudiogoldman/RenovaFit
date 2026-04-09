import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import { mapGeminiError } from '@/lib/gemini-error';
import { buildReativacaoFallback } from '@/lib/local-fallback';
import {
  buildReativacaoPrompt,
  buildObjectionReativacaoPrompt,
} from '@/lib/prompts-reativacao';
import type { ExStudentProfile, AIResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  let action: 'strategy' | 'objection' = 'strategy';
  let exStudent: ExStudentProfile = {
    name: '',
    age: '',
    cancelledWhen: '',
    cancelReason: '',
    lastPlan: '',
    tenure: '',
    mainObjection: '',
    notes: '',
  };
  let objection: string | undefined;

  try {
    const body = await request.json();
    ({ action, exStudent, objection } = body as {
      action: 'strategy' | 'objection';
      exStudent: ExStudentProfile;
      objection?: string;
    });

    let prompt = '';
    let systemInstruction = 'Você é um especialista em reativação de ex-alunos.';

    switch (action) {
      case 'strategy':
        prompt = buildReativacaoPrompt(exStudent);
        break;
      case 'objection':
        if (!objection) {
          return NextResponse.json({ error: 'Objeção não fornecida' }, { status: 400 });
        }
        prompt = buildObjectionReativacaoPrompt(exStudent, objection);
        break;
      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 });
    }

    const content = await generateContent(prompt, systemInstruction);

    const response: AIResponse = {
      generatedAt: new Date().toISOString(),
      source: 'gemini',
      messages: [content],
      objectionReplies: {},
      nextAction: 'Enviar mensagem personalizada de reaproximação',
      diagnosticQuestions: [],
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Erro em /api/reativacao:', error);
    const mapped = mapGeminiError(error, 'Erro ao gerar estratégia de reativação');

    if (mapped.status === 429 || mapped.status === 503) {
      const fallback = buildReativacaoFallback(action, exStudent, objection);
      return NextResponse.json({ success: true, data: fallback, warning: mapped }, { status: 200 });
    }

    return NextResponse.json(
      {
        error: mapped.error,
        details: mapped.details,
      },
      { status: mapped.status },
    );
  }
}
