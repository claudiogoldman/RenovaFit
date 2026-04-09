import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
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

    const supabase = createSupabaseServerClient();
    const { data: renewal, error: renewalError } = await supabase
      .from('renewal_items')
      .select('id,name,telefone,status,owner')
      .eq('id', id)
      .eq('owner_id', user.id)
      .single();

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

    const { error } = await supabase
      .from('renewal_items')
      .update(updatePayload)
      .eq('id', id)
      .eq('owner_id', user.id);

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

    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from('renewal_items')
      .delete()
      .eq('id', id)
      .eq('owner_id', user.id);

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
