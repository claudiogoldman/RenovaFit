// Tipos compartilhados entre módulos

export type StudentProfile = {
  name: string;
  age: string;
  gender: string;
  selectedPlan?: string;
  goal: string;
  hasChildren: string;
  routine: string;
  notes: string;
};

export type LeadProfile = {
  name: string;
  age: string;
  gender: string;
  goal: string;
  availability: string;
  currentActivity: string;
  mainObjection?: string;
  notes: string;
};

export type ExStudentProfile = {
  name: string;
  age: string;
  cancelledWhen: string;
  cancelReason: string;
  lastPlan: string;
  tenure: string;
  mainObjection: string;
  notes: string;
};

export type AIResponse = {
  generatedAt: string;
  source: 'gemini' | 'fallback';
  messages: string[];
  objectionReplies: Record<string, string>;
  nextAction: string;
  diagnosticQuestions: string[];
};

export type RenewalStatus = 'ativo' | 'sumido' | 'critico' | 'renovado';

export type RenewalItem = {
  id: string;
  name: string;
  telefone: string;
  plan: string;
  status: RenewalStatus;
  renewalDate: string;
  lastContact: string;
  owner: string;
  notes: string;
};

export type HistoricoContatoCanal = 'whatsapp' | 'telefone' | 'manual';

export type HistoricoContatoTipo = 'primeiro_contato' | 'followup' | 'resposta' | 'observacao';

export type HistoricoContatoStatus = 'pendente' | 'enviado' | 'erro' | 'manual';

export type HistoricoContatoItem = {
  id: string;
  renovacaoId: string;
  strategyId?: string | null;
  alunoNome: string;
  canal: HistoricoContatoCanal;
  tipoContato: HistoricoContatoTipo;
  telefone: string;
  mensagem: string;
  statusEnvio: HistoricoContatoStatus;
  erroDetalhe: string | null;
  createdAt: string;
  owner: string;
};

export type AlunoStrategySource = 'ia' | 'manual' | 'historico';

export type StrategyProfileSnapshot = {
  student: StudentProfile;
  renewalDate?: string;
};

export type AlunoStrategyItem = {
  id: string;
  renovacaoId: string;
  alunoNome: string;
  strategyText: string;
  baseMessage: string;
  profileSnapshot?: StrategyProfileSnapshot | null;
  source: AlunoStrategySource;
  createdAt: string;
};
