import { NextRequest, NextResponse } from 'next/server';
import { carregarHistoricoContatos } from '@/lib/contact-history';
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
