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
  phone: string;
  plan: string;
  status: RenewalStatus;
  renewalDate: string;
  lastContact: string;
  owner: string;
  notes: string;
};

export type ContactChannel = 'whatsapp';

export type ContactHistoryItem = {
  id: string;
  renewalItemId: string;
  studentName: string;
  channel: ContactChannel;
  phone: string;
  message: string;
  status: 'enviado' | 'erro';
  sentAt: string;
  providerMessageId: string | null;
  errorMessage: string | null;
  owner: string;
};
