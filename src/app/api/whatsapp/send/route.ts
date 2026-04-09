import { NextRequest, NextResponse } from 'next/server';
import { sendWhatsAppTextMessage } from '@/lib/whatsapp';

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      to?: string;
      message?: string;
    };

    if (!body.to || !body.message) {
      return NextResponse.json(
        { error: 'Campos obrigatorios: to e message' },
        { status: 400 },
      );
    }

    const result = await sendWhatsAppTextMessage({
      to: body.to,
      body: body.message,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json(
      {
        error: 'Erro ao enviar mensagem no WhatsApp',
        details,
      },
      { status: 500 },
    );
  }
}
