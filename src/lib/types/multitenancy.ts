export type UserRole = 'super_admin' | 'branch_admin' | 'attendant' | 'viewer';

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  city?: string;
  state?: string;
  phone?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
}

export interface Profile {
  id: string;
  company_id?: string;
  branch_id?: string;
  role: UserRole;
  full_name?: string;
  avatar_url?: string;
  active: boolean;
  created_at: string;
  updated_at: string;
  company?: Company;
  branch?: Branch;
}

export interface UserWithProfile {
  id: string;
  email: string;
  profile: Profile;
}

export interface StrategyConfig {
  id?: string
  profile_id?: string
  branch_id?: string

  section_resumo: boolean
  section_mensagens: boolean
  section_objecoes: boolean
  section_proximo_passo: boolean
  section_gatilhos: boolean
  section_historico: boolean

  msg_primeira_abordagem: boolean
  msg_followup: boolean
  msg_direta: boolean
  msg_consultiva: boolean

  obj_preco: boolean
  obj_tempo: boolean
  obj_motivacao: boolean
  obj_concorrencia: boolean
  obj_saude: boolean

  tom: 'executivo' | 'consultivo' | 'equilibrado'
  contexto_adicional?: string
}

export type AIProvider = 'gemini' | 'openrouter'

export interface IntegrationConfig {
  id?: string
  profile_id?: string
  active_provider: AIProvider

  gemini_api_key?: string | null
  openrouter_api_key?: string | null
  openrouter_model?: string | null

  whatsapp_access_token?: string | null
  whatsapp_phone_number_id?: string | null
  whatsapp_business_account_id?: string | null
  whatsapp_verify_token?: string | null
}

export interface IntegrationConfigView {
  activeProvider: AIProvider
  openrouterModel: string
  whatsappPhoneNumberId: string
  whatsappBusinessAccountId: string
  hasGeminiApiKey: boolean
  hasOpenrouterApiKey: boolean
  hasWhatsappAccessToken: boolean
  hasWhatsappVerifyToken: boolean
}

export const DEFAULT_INTEGRATION_CONFIG_VIEW: IntegrationConfigView = {
  activeProvider: 'gemini',
  openrouterModel: 'openrouter/free',
  whatsappPhoneNumberId: '',
  whatsappBusinessAccountId: '',
  hasGeminiApiKey: false,
  hasOpenrouterApiKey: false,
  hasWhatsappAccessToken: false,
  hasWhatsappVerifyToken: false,
}

export const DEFAULT_STRATEGY_CONFIG: Omit<StrategyConfig, 'id' | 'profile_id'> = {
  section_resumo: true,
  section_mensagens: true,
  section_objecoes: true,
  section_proximo_passo: true,
  section_gatilhos: false,
  section_historico: true,
  msg_primeira_abordagem: true,
  msg_followup: true,
  msg_direta: true,
  msg_consultiva: true,
  obj_preco: true,
  obj_tempo: true,
  obj_motivacao: true,
  obj_concorrencia: false,
  obj_saude: false,
  tom: 'equilibrado',
  contexto_adicional: '',
}

// Permissões por papel
export const ROLE_PERMISSIONS: Record<
  UserRole,
  {
    canManageCompanies: boolean;
    canManageBranches: boolean;
    canManageUsers: boolean;
    canViewAllBranches: boolean;
    canEditStudents: boolean;
    canViewReports: boolean;
  }
> = {
  super_admin: {
    canManageCompanies: true,
    canManageBranches: true,
    canManageUsers: true,
    canViewAllBranches: true,
    canEditStudents: true,
    canViewReports: true,
  },
  branch_admin: {
    canManageCompanies: false,
    canManageBranches: false,
    canManageUsers: true, // só da sua filial
    canViewAllBranches: false,
    canEditStudents: true,
    canViewReports: true,
  },
  attendant: {
    canManageCompanies: false,
    canManageBranches: false,
    canManageUsers: false,
    canViewAllBranches: false,
    canEditStudents: true,
    canViewReports: false,
  },
  viewer: {
    canManageCompanies: false,
    canManageBranches: false,
    canManageUsers: false,
    canViewAllBranches: false,
    canEditStudents: false,
    canViewReports: true,
  },
};
