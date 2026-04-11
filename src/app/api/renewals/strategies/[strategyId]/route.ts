import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/supabase-auth';

type RouteContext = {
  params: Promise<{ strategyId: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    const { strategyId } = await context.params;

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId nao informado' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('aluno_strategies')
      .select('id,renovacao_id,aluno_nome,strategy_text,base_message,profile_snapshot,source,created_at')
      .eq('id', strategyId)
      .eq('owner_id', user.id)
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Estrategia nao encontrada');
    }

    return NextResponse.json({
      success: true,
      data: {
        id: String(data.id),
        renovacaoId: String(data.renovacao_id),
        alunoNome: String(data.aluno_nome || ''),
        strategyText: String(data.strategy_text || ''),
        baseMessage: String(data.base_message || ''),
        profileSnapshot: data.profile_snapshot ?? null,
        source: String(data.source || 'ia'),
        createdAt: String(data.created_at),
      },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json({ error: 'Erro ao carregar estrategia', details }, { status });
  }
}
