import type { Metadata } from 'next';
import { RetencaoRenewalList } from '@/components/retencao-renewal-list';

export const metadata: Metadata = {
  title: 'Renovações | RenovaFit',
  description: 'Lista operacional de alunos para acompanhamento de renovações.',
};

export const dynamic = 'force-dynamic';

export default function RenovacoesPage() {
  return <RetencaoRenewalList />;
}
