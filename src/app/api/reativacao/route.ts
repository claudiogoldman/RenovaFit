import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import {
  buildReativacaoPrompt,
  buildObjectionReativacaoPrompt,
} from '@/lib/prompts-reativacao';
import type { ExStudentProfile, AIResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, exStudent, objection } = body as {
      action: 'strategy' | 'objection';
      exStudent: ExStudentProfile;
      objection?: string;
    };

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
    return NextResponse.json(
      {
        error: 'Erro ao gerar estratégia de reativação',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
