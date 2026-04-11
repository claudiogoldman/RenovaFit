import type { createSupabaseAdminClient } from '@/lib/supabase-server';
import type {
  HistoricoContatoCanal,
  HistoricoContatoItem,
  HistoricoContatoStatus,
  HistoricoContatoTipo,
} from '@/lib/types';

type SupabaseClient = ReturnType<typeof createSupabaseAdminClient>;

type HistoricoContatoRow = {
  id: string;
  owner_id: string;
  renovacao_id: string;
  aluno_nome: string;
  canal: HistoricoContatoCanal;
  tipo_contato: HistoricoContatoTipo;
  telefone: string | null;
  mensagem: string;
  status_envio: HistoricoContatoStatus;
  erro_detalhe: string | null;
  owner: string | null;
  created_at: string;
};

export type RegistrarHistoricoInput = {
  ownerId: string;
  renovacaoId: string;
  alunoNome: string;
  canal: HistoricoContatoCanal;
  tipoContato: HistoricoContatoTipo;
  telefone?: string;
  mensagem: string;
  statusEnvio: HistoricoContatoStatus;
  erroDetalhe?: string | null;
  owner?: string | null;
};

export function mapHistoricoRowToItem(row: HistoricoContatoRow): HistoricoContatoItem {
  return {
    id: row.id,
    renovacaoId: row.renovacao_id,
    alunoNome: row.aluno_nome,
    canal: row.canal,
    tipoContato: row.tipo_contato,
    telefone: row.telefone || '',
    mensagem: row.mensagem,
    statusEnvio: row.status_envio,
    erroDetalhe: row.erro_detalhe,
    createdAt: row.created_at,
    owner: row.owner || '',
  };
}

export async function registrarHistoricoContato(
  supabase: SupabaseClient,
  input: RegistrarHistoricoInput,
): Promise<void> {
  const { error } = await supabase.from('historico_contatos').insert({
    owner_id: input.ownerId,
    renovacao_id: input.renovacaoId,
    aluno_nome: input.alunoNome,
    canal: input.canal,
    tipo_contato: input.tipoContato,
    telefone: input.telefone || null,
    mensagem: input.mensagem,
    status_envio: input.statusEnvio,
    erro_detalhe: input.erroDetalhe || null,
    owner: input.owner || null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function carregarHistoricoContatos(
  supabase: SupabaseClient,
  ownerId: string,
  limit: number,
): Promise<HistoricoContatoItem[]> {
  const { data, error } = await supabase
    .from('historico_contatos')
    .select('id,owner_id,renovacao_id,aluno_nome,canal,tipo_contato,telefone,mensagem,status_envio,erro_detalhe,owner,created_at')
    .eq('owner_id', ownerId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data || []).map((row) => mapHistoricoRowToItem(row as HistoricoContatoRow));
}
