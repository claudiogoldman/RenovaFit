import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import {
  buildConversaoPrompt,
  buildMediaPrompt,
  buildObjectionPrompt,
} from '@/lib/prompts-conversao';
import type { LeadProfile, AIResponse } from '@/lib/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, lead, objection } = body as {
      action: 'initial' | 'messages' | 'objection';
      lead: LeadProfile;
      objection?: string;
    };

    let prompt = '';
    let systemInstruction = 'Você está ajudando um especialista em vendas de academia a converter leads em alunos.';

    switch (action) {
      case 'initial':
        prompt = buildConversaoPrompt(lead);
        break;
      case 'messages':
        prompt = buildMediaPrompt(lead);
        systemInstruction = 'Você cria mensagens curtas e efetivas para WhatsApp.';
        break;
      case 'objection':
        if (!objection) {
          return NextResponse.json({ error: 'Objeção não fornecida' }, { status: 400 });
        }
        prompt = buildObjectionPrompt(lead, objection);
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
      nextAction: 'Validar resposta e adaptar conforme feedback',
      diagnosticQuestions: [],
    };

    return NextResponse.json({ success: true, data: response });
  } catch (error) {
    console.error('Erro em /api/conversao:', error);
    return NextResponse.json(
      {
        error: 'Erro ao gerar conteúdo',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
