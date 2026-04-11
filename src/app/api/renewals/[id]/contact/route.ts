import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/supabase-auth';
import { registrarHistoricoContato } from '@/lib/contact-history';
import { isValidPhone, normalizePhone, sendWhatsAppTextMessage } from '@/lib/whatsapp';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type RenewalRow = {
  id: string;
  name: string;
  telefone: string | null;
  owner: string | null;
  last_contact: string | null;
};

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
      telefone?: string;
      message?: string;
      tipoContato?: 'primeiro_contato' | 'followup' | 'resposta' | 'observacao';
      canal?: 'whatsapp' | 'manual';
      strategyId?: string;
    };

    const canal = body.canal ?? 'whatsapp';

    const supabase = createSupabaseAdminClient();

    const { data: renewalData, error: renewalError } = await supabase
      .from('renewal_items')
      .select('id,name,telefone,owner,last_contact')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

    if (renewalError || !renewalData) {
      throw new Error(renewalError?.message || 'Aluno nao encontrado');
    }

    const renewal = renewalData as RenewalRow;
    const message = (body.message || buildDefaultMessage(renewal.name)).trim();
    const tipoContato = body.tipoContato || (renewal.last_contact ? 'followup' : 'primeiro_contato');
    const ownerName =
      renewal.owner ||
      (user.user_metadata?.full_name as string | undefined) ||
      user.email ||
      'Atendente';

    if (!message) {
      return NextResponse.json({ error: 'Mensagem nao informada' }, { status: 400 });
    }

    // ── Canal manual: apenas registra histórico, sem envio WhatsApp ──
    if (canal === 'manual') {
      const sentAtIso = new Date().toISOString();
      await registrarHistoricoContato(supabase, {
        ownerId: user.id,
        renovacaoId: id,
        strategyId: body.strategyId || null,
        alunoNome: renewal.name,
        canal: 'manual',
        tipoContato,
        telefone: '',
        mensagem: message,
        statusEnvio: 'enviado',
        owner: ownerName,
      });
      await supabase
        .from('renewal_items')
        .update({ last_contact: sentAtIso })
        .eq('id', id)
        .eq('owner_id', user.id);
      return NextResponse.json({ success: true, data: { sentAt: sentAtIso } });
    }

    // ── Canal WhatsApp ──
    const telefone = normalizePhone((body.telefone || renewal.telefone || '').trim());

    if (!isValidPhone(telefone)) {
      return NextResponse.json({ error: 'Telefone invalido para este aluno' }, { status: 400 });
    }

    const sentAtIso = new Date().toISOString();

    try {
      const provider = await sendWhatsAppTextMessage({
        to: telefone,
        body: message,
      });

      await supabase
        .from('renewal_items')
        .update({ last_contact: sentAtIso, telefone })
        .eq('id', id)
        .eq('owner_id', user.id);

      await registrarHistoricoContato(supabase, {
        ownerId: user.id,
        renovacaoId: id,
        strategyId: body.strategyId || null,
        alunoNome: renewal.name,
        canal: 'whatsapp',
        tipoContato,
        telefone,
        mensagem: message,
        statusEnvio: 'enviado',
        owner: ownerName,
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

      await registrarHistoricoContato(supabase, {
        ownerId: user.id,
        renovacaoId: id,
        strategyId: body.strategyId || null,
        alunoNome: renewal.name,
        canal: 'whatsapp',
        tipoContato,
        telefone,
        mensagem: message,
        statusEnvio: 'erro',
        erroDetalhe: errorMessage,
        owner: ownerName,
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
