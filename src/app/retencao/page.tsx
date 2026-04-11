import type { Metadata } from 'next';
import { RetencaoPageClient } from '@/components/retencao/RetencaoPageClient';

export const metadata: Metadata = {
  title: 'Retenção de Alunos | RenovaFit',
  description:
    'App de IA para reter alunos ativos. Gera estratégias de renovação, diagnóstico de obstáculos e propostas personalizadas.',
};

export const dynamic = 'force-dynamic';

interface RetencaoPageProps {
  searchParams: Promise<{ alunoId?: string }>;
}

export default async function RetencaoPage({ searchParams }: RetencaoPageProps) {
  const params = await searchParams;
  return <RetencaoPageClient initialAlunoId={params.alunoId} />;
}
