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
  notes: string | null;
  created_at?: string;
};

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
    const { data, error } = await supabase
      .from('renewal_items')
      .select('id,name,telefone,plan,status,renewal_date,last_contact,owner,owner_id,notes,created_at')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

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
    const payload = {
      name: body.name,
      telefone: body.telefone ? normalizePhone(body.telefone) : null,
      plan: body.plan,
      status: body.status,
      owner_id: user.id,
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
