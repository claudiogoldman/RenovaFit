import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth/getProfile';

export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['super_admin']);
    const supabase = createSupabaseAdminClient();

    const { data, count, error } = await supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .order('name');

    if (error) throw error;

    return NextResponse.json({ success: true, data, count });
  } catch (error) {
    console.error('GET /api/admin/companies:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['super_admin']);
    const { name, slug, logo_url } = await request.json();

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('companies')
      .insert({
        name,
        slug,
        logo_url,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('POST /api/admin/companies:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireRole(request, ['super_admin']);
    const { company_id, name, slug, logo_url, active } = await request.json();

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from('companies')
      .update({ name, slug, logo_url, active })
      .eq('id', company_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/companies:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
}
