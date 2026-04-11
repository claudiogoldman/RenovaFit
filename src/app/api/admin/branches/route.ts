import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth/getProfile';

export async function GET(request: NextRequest) {
  try {
    const userProfile = await requireRole(request, ['super_admin', 'branch_admin', 'attendant', 'viewer']);
    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from('branches')
      .select('*, company:companies(name)', { count: 'exact' });

    // Non-super_admin veem apenas sua filial
   if (userProfile.role !== 'super_admin') {
      query = query.eq('id', userProfile.branch_id);
    }

    const { data, count, error } = await query.order('name');

    if (error) throw error;

    return NextResponse.json({ success: true, data, count });
  } catch (error) {
    console.error('GET /api/admin/branches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireRole(request, ['super_admin']);
    const { company_id, name, city, state, phone } = await request.json();

    const supabase = createSupabaseAdminClient();

    const { data, error } = await supabase
      .from('branches')
      .insert({
        company_id,
        name,
        city,
        state,
        phone,
        active: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('POST /api/admin/branches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await requireRole(request, ['super_admin', 'branch_admin']);
    const { branch_id, name, city, state, phone, active } = await request.json();

    // branch_admin só edita sua filial
    if (profile.role === 'branch_admin' && branch_id !== profile.branch_id) {
      return NextResponse.json(
        { error: 'Você só pode editar sua própria filial' },
        { status: 403 }
      );
    }

    const supabase = createSupabaseAdminClient();
    const { error } = await supabase
      .from('branches')
      .update({ name, city, state, phone, active })
      .eq('id', branch_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/branches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    await requireRole(request, ['super_admin']);
    const { branch_id } = await request.json();

    const supabase = createSupabaseAdminClient();
    // Soft delete: setar active = false
    const { error } = await supabase
      .from('branches')
      .update({ active: false })
      .eq('id', branch_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/branches:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
}
