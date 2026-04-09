import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import { mapGeminiError } from '@/lib/gemini-error';
import { buildRetencaoFallback } from '@/lib/local-fallback';
import {
  buildRetencaoPrompt,
  buildObjectionRetencaoPrompt,
  type RetencaoStrategyStyle,
} from '@/lib/prompts-retencao';
import type { StudentProfile, AIResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  let action: 'strategy' | 'objection' = 'strategy';
  let student: StudentProfile = {
    name: '',
    age: '',
    gender: '',
    goal: '',
    hasChildren: '',
    routine: '',
    notes: '',
  };
  let objection: string | undefined;
  let strategyStyle: RetencaoStrategyStyle = 'executivo';

  try {
    const body = await request.json();
    ({ action, student, objection } = body as {
      action: 'strategy' | 'objection';
      student: StudentProfile;
      objection?: string;
      strategyStyle?: RetencaoStrategyStyle;
    });
    strategyStyle = (body as { strategyStyle?: RetencaoStrategyStyle }).strategyStyle || 'executivo';

    let prompt = '';
    let systemInstruction = 'Você é um especialista em retenção de alunos de academia.';

    switch (action) {
      case 'strategy':
        prompt = buildRetencaoPrompt(student, strategyStyle);
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

    const content = (await generateContent(prompt, systemInstruction))
      .replace(/\n?FIM_DA_ESTRATEGIA\s*$/i, '')
      .trim();

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

    if (mapped.status === 429 || mapped.status === 503) {
      const fallback = buildRetencaoFallback(action, student, objection);
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
