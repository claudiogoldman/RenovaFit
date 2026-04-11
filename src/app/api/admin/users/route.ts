import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { requireRole } from '@/lib/auth/getProfile';

export async function GET(request: NextRequest) {
  try {
    const profile = await requireRole(request, ['super_admin', 'branch_admin']);
    const supabase = createSupabaseAdminClient();

    let query = supabase
      .from('profiles')
      .select('*, company:companies(name), branch:branches(name)', { count: 'exact' });

    // branch_admin só vê usuários da sua filial
    if (profile.role === 'branch_admin') {
      query = query.eq('branch_id', profile.branch_id);
    }

    const { data, count, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json({ success: true, data, count });
  } catch (error) {
    console.error('GET /api/admin/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const profile = await requireRole(request, ['super_admin', 'branch_admin']);
    const { email, password, full_name, role, branch_id } = await request.json();

    // Validar que branch_admin só cria attendant e viewer na sua filial
    if (profile.role === 'branch_admin') {
      if (!['attendant', 'viewer'].includes(role)) {
        return NextResponse.json(
          { error: 'branch_admin só pode criar attendant ou viewer' },
          { status: 403 }
        );
      }
      if (branch_id !== profile.branch_id) {
        return NextResponse.json(
          { error: 'Você não pode gerenciar filiais de outras pessoas' },
          { status: 403 }
        );
      }
    }

    const supabase = createSupabaseAdminClient();

    // Criar usuário via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { full_name },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error('Falha ao criar usuário');

    // Criar perfil relacionado
    const { error: profileError } = await supabase.from('profiles').insert({
      id: authData.user.id,
      full_name,
      role,
      branch_id,
      company_id: profile.company_id,
      active: true,
    });

    if (profileError) throw profileError;

    return NextResponse.json({
      success: true,
      data: { id: authData.user.id, email },
    });
  } catch (error) {
    console.error('POST /api/admin/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const profile = await requireRole(request, ['super_admin', 'branch_admin']);
    const { user_id, role, active } = await request.json();

    const supabase = createSupabaseAdminClient();

    // Validar permissão
    if (profile.role === 'branch_admin') {
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('id', user_id)
        .single();

      if (targetUser?.branch_id !== profile.branch_id) {
        return NextResponse.json(
          { error: 'Você não pode editar usuários de outras filiais' },
          { status: 403 }
        );
      }
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role, active })
      .eq('id', user_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PATCH /api/admin/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const profile = await requireRole(request, ['super_admin', 'branch_admin']);
    const { user_id } = await request.json();

    const supabase = createSupabaseAdminClient();

    // Validar permissão
    if (profile.role === 'branch_admin') {
      const { data: targetUser } = await supabase
        .from('profiles')
        .select('branch_id')
        .eq('id', user_id)
        .single();

      if (targetUser?.branch_id !== profile.branch_id) {
        return NextResponse.json(
          { error: 'Você não pode deletar usuários de outras filiais' },
          { status: 403 }
        );
      }
    }

    // Soft delete: setar active = false
    const { error } = await supabase
      .from('profiles')
      .update({ active: false })
      .eq('id', user_id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/admin/users:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro desconhecido' },
      { status: 400 }
    );
  }
}
