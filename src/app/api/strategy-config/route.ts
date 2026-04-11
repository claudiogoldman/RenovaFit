import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';
import type { StrategyConfig } from '@/lib/types/multitenancy';
import { DEFAULT_STRATEGY_CONFIG } from '@/lib/types/multitenancy';

export async function GET() {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('strategy_configs')
      .select('*')
      .eq('profile_id', user.id)
      .single();

    if (error || !data) {
      // Return default config when no config saved yet
      return NextResponse.json({
        success: true,
        data: { ...DEFAULT_STRATEGY_CONFIG, profile_id: user.id },
      });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro ao carregar configurações', details }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAuth = await createSupabaseServerClient();
    const {
      data: { user },
      error: userError,
    } = await supabaseAuth.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as Partial<Omit<StrategyConfig, 'id' | 'profile_id'>>;

    // profile_id always comes from auth — never from client body
    const payload = {
      profile_id: user.id,
      section_resumo: true, // always true — cannot be disabled
      section_mensagens: body.section_mensagens ?? DEFAULT_STRATEGY_CONFIG.section_mensagens,
      section_objecoes: body.section_objecoes ?? DEFAULT_STRATEGY_CONFIG.section_objecoes,
      section_proximo_passo: body.section_proximo_passo ?? DEFAULT_STRATEGY_CONFIG.section_proximo_passo,
      section_gatilhos: body.section_gatilhos ?? DEFAULT_STRATEGY_CONFIG.section_gatilhos,
      section_historico: body.section_historico ?? DEFAULT_STRATEGY_CONFIG.section_historico,
      msg_primeira_abordagem: body.msg_primeira_abordagem ?? DEFAULT_STRATEGY_CONFIG.msg_primeira_abordagem,
      msg_followup: body.msg_followup ?? DEFAULT_STRATEGY_CONFIG.msg_followup,
      msg_direta: body.msg_direta ?? DEFAULT_STRATEGY_CONFIG.msg_direta,
      msg_consultiva: body.msg_consultiva ?? DEFAULT_STRATEGY_CONFIG.msg_consultiva,
      obj_preco: body.obj_preco ?? DEFAULT_STRATEGY_CONFIG.obj_preco,
      obj_tempo: body.obj_tempo ?? DEFAULT_STRATEGY_CONFIG.obj_tempo,
      obj_motivacao: body.obj_motivacao ?? DEFAULT_STRATEGY_CONFIG.obj_motivacao,
      obj_concorrencia: body.obj_concorrencia ?? DEFAULT_STRATEGY_CONFIG.obj_concorrencia,
      obj_saude: body.obj_saude ?? DEFAULT_STRATEGY_CONFIG.obj_saude,
      tom: body.tom ?? DEFAULT_STRATEGY_CONFIG.tom,
      contexto_adicional: body.contexto_adicional ?? '',
      updated_at: new Date().toISOString(),
    };

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('strategy_configs')
      .upsert(payload, { onConflict: 'profile_id' })
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro ao salvar configurações', details }, { status: 500 });
  }
}
