import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/supabase-auth';
import type { ContactHistoryItem } from '@/lib/types';

type ContactHistoryRow = {
  id: string;
  renewal_item_id: string;
  student_name: string;
  channel: 'whatsapp';
  phone: string;
  message: string;
  status: 'enviado' | 'erro';
  sent_at: string;
  provider_message_id: string | null;
  error_message: string | null;
  owner: string | null;
  owner_id: string;
};

function mapRowToItem(row: ContactHistoryRow): ContactHistoryItem {
  return {
    id: row.id,
    renewalItemId: row.renewal_item_id,
    studentName: row.student_name,
    channel: row.channel,
    phone: row.phone,
    message: row.message,
    status: row.status,
    sentAt: row.sent_at,
    providerMessageId: row.provider_message_id,
    errorMessage: row.error_message,
    owner: row.owner || '',
  };
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const limitParam = Number(request.nextUrl.searchParams.get('limit') || '12');
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 50) : 12;

    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from('contact_history')
      .select(
        'id,renewal_item_id,student_name,channel,phone,message,status,sent_at,provider_message_id,error_message,owner,owner_id',
      )
      .eq('owner_id', user.id)
      .order('sent_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ success: true, data: (data || []).map((row) => mapRowToItem(row as ContactHistoryRow)) });
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
