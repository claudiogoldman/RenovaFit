import { NextRequest, NextResponse } from 'next/server';
import { carregarHistoricoContatos } from '@/lib/contact-history';
import { removerHistoricoContato } from '@/lib/contact-history';
import { getAuthenticatedUser } from '@/lib/supabase-auth';
import { createSupabaseAdminClient } from '@/lib/supabase-server';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const limitParam = Number(request.nextUrl.searchParams.get('limit') || '12');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 12;

    const supabase = createSupabaseAdminClient();
    const data = await carregarHistoricoContatos(supabase, user.id, limit);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json(
      {
        error: 'Erro ao carregar historico de contatos',
        details,
      },
      { status },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const historicoId = request.nextUrl.searchParams.get('id');

    if (!historicoId) {
      return NextResponse.json({ error: 'ID do historico nao informado' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    await removerHistoricoContato(supabase, user.id, historicoId);

    return NextResponse.json({ success: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json(
      {
        error: 'Erro ao excluir historico de contato',
        details,
      },
      { status },
    );
  }
}
