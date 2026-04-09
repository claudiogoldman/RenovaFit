export type SendWhatsAppTextParams = {
  to: string;
  body: string;
};

function getWhatsAppConfig() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN?.trim();
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();
  const apiVersion = process.env.WHATSAPP_API_VERSION?.trim() || 'v22.0';

  if (!accessToken || !phoneNumberId) {
    throw new Error(
      'WhatsApp credentials are missing. Configure WHATSAPP_ACCESS_TOKEN and WHATSAPP_PHONE_NUMBER_ID.',
    );
  }

  return { accessToken, phoneNumberId, apiVersion };
}

function normalizePhone(rawPhone: string): string {
  return rawPhone.replace(/\D/g, '');
}

export async function sendWhatsAppTextMessage(params: SendWhatsAppTextParams) {
  const { accessToken, phoneNumberId, apiVersion } = getWhatsAppConfig();
  const to = normalizePhone(params.to);

  if (!to || to.length < 10) {
    throw new Error('Numero de telefone invalido. Informe DDI+DDD+numero.');
  }

  if (!params.body?.trim()) {
    throw new Error('Mensagem vazia. Gere ou escreva uma mensagem antes de enviar.');
  }

  const response = await fetch(`https://graph.facebook.com/${apiVersion}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: {
        preview_url: false,
        body: params.body,
      },
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    messages?: Array<{ id?: string }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `WhatsApp API error: ${response.status}`);
  }

  return {
    messageId: payload.messages?.[0]?.id || null,
  };
}
