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
import type { StrategyConfig } from '@/lib/types/multitenancy';
import { DEFAULT_STRATEGY_CONFIG } from '@/lib/types/multitenancy';

function buildDynamicPrompt(
  perfil: StudentProfile,
  config: StrategyConfig,
  diasParaRenovacao?: number,
): string {
  const secoes: string[] = [];

  // Seção 1: Resumo do perfil — SEMPRE incluída
  const urgencia =
    diasParaRenovacao !== undefined
      ? diasParaRenovacao <= 7
        ? `O plano vence em ${diasParaRenovacao} dias. URGENTE — ação imediata necessária.`
        : diasParaRenovacao <= 30
          ? `O plano vence em ${diasParaRenovacao} dias. Janela de oportunidade ativa.`
          : `O plano vence em ${diasParaRenovacao} dias. Renovação antecipada — destaque o benefício de renovar antes.`
      : '';

  secoes.push(`
1. RESUMO DO PERFIL E CONTEXTO DE RENOVAÇÃO
Faça um resumo conciso do perfil do aluno e o contexto atual de renovação.
${urgencia}
${config.section_historico ? 'Considere o histórico de contatos anteriores para não repetir abordagens.' : ''}
`);

  // Seção 2: Mensagens prontas
  if (config.section_mensagens) {
    const tipos: string[] = [];
    if (config.msg_primeira_abordagem) tipos.push('Primeira abordagem (tom inicial, sem pressão)');
    if (config.msg_followup) tipos.push('Follow-up (caso não responda em 48h)');
    if (config.msg_direta) tipos.push('Versão direta (objetiva, apresenta benefício)');
    if (config.msg_consultiva) tipos.push('Versão consultiva (foco no objetivo do aluno)');
    if (tipos.length > 0) {
      secoes.push(`
2. MENSAGENS PRONTAS PARA WHATSAPP
Gere as seguintes versões (máx 5 linhas cada, linguagem brasileira casual):
${tipos.map((t, i) => `${i + 1}. ${t}`).join('\n')}
`);
    }
  }

  // Seção 3: Respostas a objeções
  if (config.section_objecoes) {
    const objecoes: string[] = [];
    if (config.obj_preco) objecoes.push('"Tá caro" / "Não tenho dinheiro"');
    if (config.obj_tempo) objecoes.push('"Não tenho tempo"');
    if (config.obj_motivacao) objecoes.push('"Tô desmotivado"');
    if (config.obj_concorrencia) objecoes.push('"Vou tentar outra academia"');
    if (config.obj_saude) objecoes.push('"Tive um problema de saúde"');
    if (objecoes.length > 0) {
      secoes.push(`
3. RESPOSTAS PARA OBJEÇÕES
Para cada objeção abaixo, forneça uma resposta curta e empática para WhatsApp:
${objecoes.map((o, i) => `${i + 1}. ${o}`).join('\n')}
`);
    }
  }

  // Seção 4: Próximo passo
  if (config.section_proximo_passo) {
    secoes.push(`
4. PRÓXIMO PASSO RECOMENDADO
Indique a ação mais importante que o atendente deve tomar nas próximas 48h,
considerando o perfil do aluno e os dias até a renovação.
`);
  }

  // Seção 5: Gatilhos emocionais
  if (config.section_gatilhos) {
    secoes.push(`
5. GATILHOS EMOCIONAIS
Identifique 2-3 gatilhos emocionais específicos para este perfil
(ex: medo de perder progresso, orgulho da conquista, pertencimento à comunidade).
Explique como usar cada um na abordagem.
`);
  }

  const tomInstrucao: Record<StrategyConfig['tom'], string> = {
    executivo: 'Seja direto e conciso. Bullet points. Sem floreios.',
    consultivo: 'Seja detalhado e empático. Explique o raciocínio por trás de cada sugestão.',
    equilibrado: 'Equilibre objetividade com empatia. Nem muito curto nem muito longo.',
  };

  const contextoExtra = config.contexto_adicional
    ? `\nCONTEXTO ADICIONAL DO ATENDENTE: ${config.contexto_adicional}`
    : '';

  return `Você é especialista em retenção de clientes de academia via WhatsApp.
Tom da resposta: ${tomInstrucao[config.tom]}
${contextoExtra}

PERFIL DO ALUNO:
${JSON.stringify(perfil, null, 2)}

Gere a estratégia com EXATAMENTE as seções numeradas abaixo (não adicione outras):
${secoes.join('\n')}

Regras:
- Linguagem brasileira casual (pode usar "tu" ou "você")
- Use o nome do aluno naturalmente
- Nunca pareça robótico ou cobrança automática
- Adapte o tom à idade: jovem=mais informal, 40+=mais respeitoso mas leve`;
}

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
  let config: StrategyConfig | undefined;
  let diasParaRenovacao: number | undefined;

  try {
    const body = await request.json();
    ({ action, student, objection } = body as {
      action: 'strategy' | 'objection';
      student: StudentProfile;
      objection?: string;
    });
    strategyStyle = (body as { strategyStyle?: RetencaoStrategyStyle }).strategyStyle || 'executivo';
    config = (body as { config?: StrategyConfig }).config;
    diasParaRenovacao = (body as { diasParaRenovacao?: number }).diasParaRenovacao;

    let prompt = '';
    const systemInstruction = 'Você é um especialista em retenção de alunos de academia.';

    switch (action) {
      case 'strategy':
        // Use dynamic prompt when config is provided, fallback to legacy prompt otherwise
        prompt = config
          ? buildDynamicPrompt(student, config, diasParaRenovacao)
          : buildRetencaoPrompt(student, strategyStyle);
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
