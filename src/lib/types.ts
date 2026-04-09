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
