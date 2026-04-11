import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdminClient, createSupabaseServerClient } from '@/lib/supabase-server';
import {
  DEFAULT_INTEGRATION_CONFIG_VIEW,
  type AIProvider,
  type IntegrationConfigView,
} from '@/lib/types/multitenancy';

type IntegrationRow = {
  profile_id: string;
  active_provider: AIProvider;
  gemini_api_key: string | null;
  openrouter_api_key: string | null;
  openrouter_model: string | null;
  whatsapp_access_token: string | null;
  whatsapp_phone_number_id: string | null;
  whatsapp_business_account_id: string | null;
  whatsapp_verify_token: string | null;
};

function rowToView(row: IntegrationRow | null): IntegrationConfigView {
  if (!row) return { ...DEFAULT_INTEGRATION_CONFIG_VIEW };

  return {
    activeProvider: row.active_provider || 'gemini',
    openrouterModel: row.openrouter_model || 'openrouter/free',
    whatsappPhoneNumberId: row.whatsapp_phone_number_id || '',
    whatsappBusinessAccountId: row.whatsapp_business_account_id || '',
    hasGeminiApiKey: Boolean(row.gemini_api_key),
    hasOpenrouterApiKey: Boolean(row.openrouter_api_key),
    hasWhatsappAccessToken: Boolean(row.whatsapp_access_token),
    hasWhatsappVerifyToken: Boolean(row.whatsapp_verify_token),
  };
}

async function getAuthenticatedUserId(): Promise<string | null> {
  const supabaseAuth = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabaseAuth.auth.getUser();

  if (error || !user) return null;
  return user.id;
}

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from('integration_configs')
      .select(
        'profile_id,active_provider,gemini_api_key,openrouter_api_key,openrouter_model,whatsapp_access_token,whatsapp_phone_number_id,whatsapp_business_account_id,whatsapp_verify_token',
      )
      .eq('profile_id', userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: rowToView((data as IntegrationRow | null) || null) });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro ao carregar integracoes', details }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = (await request.json()) as {
      activeProvider?: AIProvider;
      geminiApiKey?: string;
      openrouterApiKey?: string;
      openrouterModel?: string;
      whatsappAccessToken?: string;
      whatsappPhoneNumberId?: string;
      whatsappBusinessAccountId?: string;
      whatsappVerifyToken?: string;
    };

    const supabase = createSupabaseAdminClient();

    const { data: existingData } = await supabase
      .from('integration_configs')
      .select(
        'profile_id,active_provider,gemini_api_key,openrouter_api_key,openrouter_model,whatsapp_access_token,whatsapp_phone_number_id,whatsapp_business_account_id,whatsapp_verify_token',
      )
      .eq('profile_id', userId)
      .maybeSingle();

    const existing = (existingData as IntegrationRow | null) || null;

    const payload = {
      profile_id: userId,
      active_provider: body.activeProvider || existing?.active_provider || 'gemini',
      gemini_api_key: body.geminiApiKey?.trim() ? body.geminiApiKey.trim() : existing?.gemini_api_key || null,
      openrouter_api_key: body.openrouterApiKey?.trim()
        ? body.openrouterApiKey.trim()
        : existing?.openrouter_api_key || null,
      openrouter_model: body.openrouterModel?.trim() || existing?.openrouter_model || 'openrouter/free',
      whatsapp_access_token: body.whatsappAccessToken?.trim()
        ? body.whatsappAccessToken.trim()
        : existing?.whatsapp_access_token || null,
      whatsapp_phone_number_id:
        body.whatsappPhoneNumberId?.trim() || existing?.whatsapp_phone_number_id || null,
      whatsapp_business_account_id:
        body.whatsappBusinessAccountId?.trim() || existing?.whatsapp_business_account_id || null,
      whatsapp_verify_token: body.whatsappVerifyToken?.trim()
        ? body.whatsappVerifyToken.trim()
        : existing?.whatsapp_verify_token || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('integration_configs')
      .upsert(payload, { onConflict: 'profile_id' })
      .select(
        'profile_id,active_provider,gemini_api_key,openrouter_api_key,openrouter_model,whatsapp_access_token,whatsapp_phone_number_id,whatsapp_business_account_id,whatsapp_verify_token',
      )
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: rowToView(data as IntegrationRow) });
  } catch (error) {
    const details = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: 'Erro ao salvar integracoes', details }, { status: 500 });
  }
}
