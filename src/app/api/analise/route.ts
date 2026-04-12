import { NextRequest, NextResponse } from 'next/server';
import { generateContent } from '@/lib/gemini';
import { mapGeminiError } from '@/lib/gemini-error';
import {
  buildAnaliseInteracoesPrompt,
  buildAnaliseTextoLivrePrompt,
  buildScriptVendasPrompt,
  type InteractionEntry,
} from '@/lib/prompts-analise';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      alunoNome?: string;
      mode?: 'historico' | 'livre' | 'script';
      interacoes?: InteractionEntry[];
      textoLivre?: string;
      analise?: string;
    };

    const alunoNome = (body.alunoNome || 'Aluno').trim();
    const mode = body.mode ?? 'livre';

    let prompt: string;

    if (mode === 'script') {
      const analise = (body.analise || '').trim();
      if (!analise) {
        return NextResponse.json(
          { error: 'Informe a análise para gerar o script de vendas.' },
          { status: 400 },
        );
      }
      prompt = buildScriptVendasPrompt(alunoNome, analise);
    } else if (mode === 'historico') {
      if (!Array.isArray(body.interacoes) || body.interacoes.length === 0) {
        return NextResponse.json(
          { error: 'Nenhuma interação fornecida para análise.' },
          { status: 400 },
        );
      }
      prompt = buildAnaliseInteracoesPrompt(alunoNome, body.interacoes);
    } else {
      const texto = (body.textoLivre || '').trim();
      if (!texto) {
        return NextResponse.json(
          { error: 'Informe o texto das interações para análise.' },
          { status: 400 },
        );
      }
      prompt = buildAnaliseTextoLivrePrompt(alunoNome, texto);
    }

    const text = await generateContent(prompt);

    return NextResponse.json({ success: true, data: { analise: text } });
  } catch (err) {
    const mapped = mapGeminiError(err, 'Erro ao gerar análise');
    return NextResponse.json(
      { error: mapped.error },
      { status: mapped.status ?? 500 },
    );
  }
}
