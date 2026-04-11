import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/supabase-auth';
import { normalizePhone } from '@/lib/whatsapp';
import type { RenewalItem, RenewalStatus } from '@/lib/types';

type RenewalRow = {
  id: string;
  name: string;
  telefone: string | null;
  plan: string;
  status: RenewalStatus;
  renewal_date: string | null;
  last_contact: string | null;
  owner: string | null;
  owner_id: string;
  branch_id?: string | null;
  company_id?: string | null;
  notes: string | null;
  created_at?: string;
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

function applyScopeFilter<T extends { eq: (...args: [string, string]) => T }>(
  query: T,
  scope: UserScope,
): T {
  let scoped = query;
  if (scope.companyId) {
    scoped = scoped.eq('company_id', scope.companyId);
  }
  if (scope.branchId) {
    scoped = scoped.eq('branch_id', scope.branchId);
  }
  return scoped;
}

function mapRowToItem(row: RenewalRow): RenewalItem {
  return {
    id: row.id,
    name: row.name,
    telefone: row.telefone || '',
    plan: row.plan,
    status: row.status,
    renewalDate: row.renewal_date || '',
    lastContact: row.last_contact || '',
    owner: row.owner || '',
    notes: row.notes || '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const supabase = createSupabaseAdminClient();
      const scope = await getUserScope(supabase, user.id);
      const { searchParams } = new URL(request.url);
      const q = searchParams.get('q')?.trim();

      let query = supabase
        .from('renewal_items')
        .select('id,name,telefone,plan,status,renewal_date,last_contact,owner,owner_id,notes,created_at')
        .order('created_at', { ascending: false });

      query = applyScopeFilter(query, scope);

      if (q && q.length >= 2) {
        query = query.ilike('name', `%${q}%`);
      }

      const { data, error } = q && q.length >= 2 ? await query.limit(10) : await query;

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapRowToItem),
    });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json(
      {
        error: 'Erro ao carregar lista de renovacao',
        details,
      },
      { status },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = (await request.json()) as Omit<RenewalItem, 'id'>;

    if (!body.name || !body.plan || !body.status) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: name, plan e status' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseAdminClient();
    const scope = await getUserScope(supabase, user.id);
    const payload = {
      name: body.name,
      telefone: body.telefone ? normalizePhone(body.telefone) : null,
      plan: body.plan,
      status: body.status,
      owner_id: user.id,
      branch_id: scope.branchId,
      company_id: scope.companyId,
      owner:
        (user.user_metadata?.full_name as string | undefined) ||
        (user.email as string | undefined) ||
        'Atendente',
      renewal_date: body.renewalDate || null,
      last_contact: body.lastContact || null,
      notes: body.notes || null,
    };

    const { data, error } = await supabase
      .from('renewal_items')
      .insert(payload)
      .select('id,name,telefone,plan,status,renewal_date,last_contact,owner,owner_id,notes')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data: mapRowToItem(data as RenewalRow) });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json(
      {
        error: 'Erro ao criar item de renovacao',
        details,
      },
      { status },
    );
  }
}
