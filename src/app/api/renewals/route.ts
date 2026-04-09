import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import type { RenewalItem, RenewalStatus } from '@/lib/types';

type RenewalRow = {
  id: string;
  name: string;
  plan: string;
  status: RenewalStatus;
  renewal_date: string | null;
  last_contact: string | null;
  owner: string | null;
  notes: string | null;
  created_at?: string;
};

function mapRowToItem(row: RenewalRow): RenewalItem {
  return {
    id: row.id,
    name: row.name,
    plan: row.plan,
    status: row.status,
    renewalDate: row.renewal_date || '',
    lastContact: row.last_contact || '',
    owner: row.owner || '',
    notes: row.notes || '',
  };
}

export async function GET() {
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('renewal_items')
      .select('id,name,plan,status,renewal_date,last_contact,owner,notes,created_at')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      data: (data || []).map(mapRowToItem),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro ao carregar lista de renovacao',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Omit<RenewalItem, 'id'>;

    if (!body.name || !body.plan || !body.status) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: name, plan e status' },
        { status: 400 },
      );
    }

    const supabase = createSupabaseServerClient();
    const payload = {
      name: body.name,
      plan: body.plan,
      status: body.status,
      renewal_date: body.renewalDate || null,
      last_contact: body.lastContact || null,
      owner: body.owner || null,
      notes: body.notes || null,
    };

    const { data, error } = await supabase
      .from('renewal_items')
      .insert(payload)
      .select('id,name,plan,status,renewal_date,last_contact,owner,notes')
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data: mapRowToItem(data as RenewalRow) });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Erro ao criar item de renovacao',
        details: error instanceof Error ? error.message : 'Erro desconhecido',
      },
      { status: 500 },
    );
  }
}
