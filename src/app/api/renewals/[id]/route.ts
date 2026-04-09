import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server';
import { getAuthenticatedUser } from '@/lib/supabase-auth';
import type { RenewalStatus } from '@/lib/types';

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id } = await context.params;
    const body = (await request.json()) as {
      status?: RenewalStatus;
    };

    if (!id) {
      return NextResponse.json({ error: 'ID nao informado' }, { status: 400 });
    }

    if (!body.status) {
      return NextResponse.json({ error: 'Status nao informado' }, { status: 400 });
    }

    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from('renewal_items')
      .update({ status: body.status })
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
        error: 'Erro ao atualizar status',
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
