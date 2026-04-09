import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/supabase-auth';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type RenewalRow = {
  id: string;
  name: string;
  phone: string | null;
  owner: string | null;
};

function normalizePhone(rawPhone: string): string {
  return rawPhone.replace(/\D/g, '');
}

function buildDefaultMessage(name: string): string {
  return `Oi ${name}, tudo bem?\n\nPassei para te lembrar da renovacao do seu plano na academia. Quer que eu te mande as opcoes e valores atualizados?`;
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: 'ID nao informado' }, { status: 400 });
    }

    const body = (await request.json()) as {
      phone?: string;
      message?: string;
    };

    const supabase = createSupabaseServerClient();

    const { data: renewalData, error: renewalError } = await supabase
      .from('renewal_items')
      .select('id,name,phone,owner')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (renewalError || !renewalData) {
      throw new Error(renewalError?.message || 'Aluno nao encontrado');
    }

    const renewal = renewalData as RenewalRow;
    const selectedPhone = normalizePhone((body.phone || renewal.phone || '').trim());
    const message = (body.message || buildDefaultMessage(renewal.name)).trim();

    if (!selectedPhone) {
      return NextResponse.json({ error: 'Telefone nao informado para este aluno' }, { status: 400 });
    }

    if (!message) {
      return NextResponse.json({ error: 'Mensagem nao informada' }, { status: 400 });
    }

    const sentAtIso = new Date().toISOString();

    try {
      const provider = await sendWhatsAppTextMessage({
        to: selectedPhone,
        body: message,
      });

      await supabase.from('renewal_items').update({ last_contact: sentAtIso }).eq('id', id).eq('owner_id', user.id);

      await supabase.from('contact_history').insert({
        owner_id: user.id,
        renewal_item_id: id,
        student_name: renewal.name,
        channel: 'whatsapp',
        phone: selectedPhone,
        message,
        status: 'enviado',
        sent_at: sentAtIso,
        provider_message_id: provider.messageId,
        owner: renewal.owner || user.email || 'Atendente',
      });

      return NextResponse.json({
        success: true,
        data: {
          messageId: provider.messageId,
          sentAt: sentAtIso,
        },
      });
    } catch (sendError) {
      const errorMessage = sendError instanceof Error ? sendError.message : 'Erro no envio';

      await supabase.from('contact_history').insert({
        owner_id: user.id,
        renewal_item_id: id,
        student_name: renewal.name,
        channel: 'whatsapp',
        phone: selectedPhone,
        message,
        status: 'erro',
        sent_at: sentAtIso,
        error_message: errorMessage,
        owner: renewal.owner || user.email || 'Atendente',
      });

      return NextResponse.json(
        {
          error: 'Falha ao enviar mensagem no WhatsApp',
          details: errorMessage,
        },
        { status: 500 },
      );
    }
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    const status = /missing bearer token|unauthorized/i.test(details) ? 401 : 500;
    return NextResponse.json(
      {
        error: 'Erro ao enviar contato',
        details,
      },
      { status },
    );
  }
}
