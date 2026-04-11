import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/supabase-auth';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await context.params;
    const limitParam = Number(request.nextUrl.searchParams.get('limit') || '12');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 30) : 12;

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('aluno_strategies')
      .select('id,renovacao_id,aluno_nome,strategy_text,base_message,profile_snapshot,source,created_at')
      .eq('owner_id', user.id)
      .eq('renovacao_id', id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    const mapped = (data || []).map((row) => ({
      id: String(row.id),
      renovacaoId: String(row.renovacao_id),
      alunoNome: String(row.aluno_nome || ''),
      strategyText: String(row.strategy_text || ''),
      baseMessage: String(row.base_message || ''),
      profileSnapshot: row.profile_snapshot ?? null,
      source: String(row.source || 'ia'),
      createdAt: String(row.created_at),
    }));

    return NextResponse.json({ success: true, data: mapped });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json({ error: 'Erro ao carregar estrategias', details }, { status });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await context.params;

    const body = (await request.json()) as {
      alunoNome?: string;
      strategyText?: string;
      baseMessage?: string;
      profileSnapshot?: unknown;
      source?: 'ia' | 'manual' | 'historico';
    };

    if (!body.strategyText?.trim()) {
      return NextResponse.json({ error: 'strategyText obrigatorio' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();

    // validate renewal ownership
    const { data: renewal, error: renewalError } = await supabase
      .from('renewal_items')
      .select('id,name')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (renewalError || !renewal) {
      throw new Error(renewalError?.message || 'Aluno nao encontrado');
    }

    const { data, error } = await supabase
      .from('aluno_strategies')
      .insert({
        owner_id: user.id,
        renovacao_id: id,
        aluno_nome: (body.alunoNome || String(renewal.name || '')).trim(),
        strategy_text: body.strategyText.trim(),
        base_message: body.baseMessage?.trim() || null,
        profile_snapshot: body.profileSnapshot ?? null,
        source: body.source || 'ia',
      })
      .select('id,renovacao_id,aluno_nome,strategy_text,base_message,profile_snapshot,source,created_at')
      .single();

    if (error || !data) {
      throw new Error(error?.message || 'Erro ao salvar estrategia');
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
    return NextResponse.json({ error: 'Erro ao salvar estrategia', details }, { status });
  }
}
