import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import { mapGeminiError } from '@/lib/gemini-error';
import {
  buildRetencaoPrompt,
  buildObjectionRetencaoPrompt,
} from '@/lib/prompts-retencao';
import type { StudentProfile, AIResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, student, objection } = body as {
      action: 'strategy' | 'objection';
      student: StudentProfile;
      objection?: string;
    };

    let prompt = '';
    let systemInstruction = 'Você é um especialista em retenção de alunos de academia.';

    switch (action) {
      case 'strategy':
        prompt = buildRetencaoPrompt(student);
        break;
      case 'objection':
        if (!objection) {
          return NextResponse.json({ error: 'Objeção não fornecida' }, { status: 400 });
        }
        prompt = buildObjectionRetencaoPrompt(student, objection);
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
      nextAction: 'Executar abordagem personalizada',
      diagnosticQuestions: [],
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Erro em /api/retencao:', error);
    const mapped = mapGeminiError(error, 'Erro ao gerar estratégia');
    return NextResponse.json(
      {
        error: mapped.error,
        details: mapped.details,
      },
      { status: mapped.status },
    );
  }
}
