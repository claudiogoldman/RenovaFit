import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/supabase-auth';
import { registrarHistoricoContato } from '@/lib/contact-history';
import { normalizePhone } from '@/lib/whatsapp';
import type { RenewalStatus } from '@/lib/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type RenewalRow = {
  id: string;
  name: string;
  telefone: string | null;
  status: RenewalStatus;
  owner: string | null;
};

  type UserScope = {
    branchId: string | null;
    companyId: string | null;
  };

  async function getUserScope(supabase: ReturnType<typeof createSupabaseAdminClient>, userId: string): Promise<UserScope> {
    const { data: profile } = await supabase
      .from('profiles')
      .select('branch_id,company_id')
      .eq('id', userId)
      .single();

    return {
      branchId: (profile?.branch_id as string | null | undefined) ?? null,
      companyId: (profile?.company_id as string | null | undefined) ?? null,
    };
  }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID nao informado' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const scope = await getUserScope(supabase, user.id);
    let query = supabase
      .from('renewal_items')
      .select('id,name,telefone,plan,status,renewal_date,last_contact,owner,owner_id,notes')
      .eq('id', id);
    if (scope.companyId) {
      query = query.eq('company_id', scope.companyId);
    }
    if (scope.branchId) {
      query = query.eq('branch_id', scope.branchId);
    }
    const { data, error } = await query.single();

    if (error || !data) {
      return NextResponse.json({ error: 'Aluno nao encontrado' }, { status: 404 });
    }

    const row = data as { id: string; name: string; telefone: string | null; plan: string; status: RenewalStatus; renewal_date: string | null; last_contact: string | null; owner: string | null; notes: string | null };
    return NextResponse.json({
      success: true,
      data: {
        id: row.id,
        name: row.name,
        telefone: row.telefone || '',
        plan: row.plan,
        status: row.status,
        renewalDate: row.renewal_date || '',
        lastContact: row.last_contact || '',
        owner: row.owner || '',
        notes: row.notes || '',
      },
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json({ error: 'Erro ao buscar aluno', details }, { status });
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: RenewalStatus;
      telefone?: string;
    };

    if (!id) {
      return NextResponse.json({ error: 'ID nao informado' }, { status: 400 });
    }

    if (!body.status && typeof body.telefone !== 'string') {
      return NextResponse.json({ error: 'Nada para atualizar' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const scope = await getUserScope(supabase, user.id);
    let renewalQuery = supabase
      .from('renewal_items')
      .select('id,name,telefone,status,owner')
      .eq('id', id);
    if (scope.companyId) {
      renewalQuery = renewalQuery.eq('company_id', scope.companyId);
    }
    if (scope.branchId) {
      renewalQuery = renewalQuery.eq('branch_id', scope.branchId);
    }
    const { data: renewal, error: renewalError } = await renewalQuery.single();

    if (renewalError || !renewal) {
      throw new Error(renewalError?.message || 'Aluno nao encontrado');
    }

    const current = renewal as RenewalRow;

    const updatePayload: { status?: RenewalStatus; telefone?: string | null } = {};
    if (body.status) {
      updatePayload.status = body.status;
    }

    if (typeof body.telefone === 'string') {
      updatePayload.telefone = body.telefone.trim() ? normalizePhone(body.telefone) : null;
    }

    let updateQuery = supabase.from('renewal_items').update(updatePayload).eq('id', id);
    if (scope.companyId) {
      updateQuery = updateQuery.eq('company_id', scope.companyId);
    }
    if (scope.branchId) {
      updateQuery = updateQuery.eq('branch_id', scope.branchId);
    }
    const { error } = await updateQuery;

    if (error) {
      throw new Error(error.message);
    }

    if (body.status && body.status !== current.status) {
      await registrarHistoricoContato(supabase, {
        ownerId: user.id,
        renovacaoId: id,
        alunoNome: current.name,
        canal: 'manual',
        tipoContato: 'observacao',
        telefone: current.telefone || '',
        mensagem: `Status alterado de ${current.status} para ${body.status}`,
        statusEnvio: 'manual',
        owner:
          current.owner ||
          (user.user_metadata?.full_name as string | undefined) ||
          user.email ||
          'Atendente',
      });
    }

    if (typeof body.telefone === 'string' && normalizePhone(body.telefone) !== normalizePhone(current.telefone || '')) {
      await registrarHistoricoContato(supabase, {
        ownerId: user.id,
        renovacaoId: id,
        alunoNome: current.name,
        canal: 'manual',
        tipoContato: 'observacao',
        telefone: body.telefone,
        mensagem: 'Telefone atualizado manualmente na carteira de retencao',
        statusEnvio: 'manual',
        owner:
          current.owner ||
          (user.user_metadata?.full_name as string | undefined) ||
          user.email ||
          'Atendente',
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json(
      {
        error: 'Erro ao atualizar cadastro',
        details,
      },
      { status },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(_request);
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID nao informado' }, { status: 400 });
    }

    const supabase = createSupabaseAdminClient();
    const scope = await getUserScope(supabase, user.id);
    let deleteQuery = supabase.from('renewal_items').delete().eq('id', id);
    if (scope.companyId) {
      deleteQuery = deleteQuery.eq('company_id', scope.companyId);
    }
    if (scope.branchId) {
      deleteQuery = deleteQuery.eq('branch_id', scope.branchId);
    }
    const { error } = await deleteQuery;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json(
      {
        error: 'Erro ao remover item',
        details,
      },
      { status },
    );
  }
}
