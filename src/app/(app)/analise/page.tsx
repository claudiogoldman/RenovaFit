import type { Metadata } from 'next';
import { AnalisePageClient } from '@/components/analise/AnalisePageClient';

export const metadata: Metadata = {
  title: 'Analisador de Interações | RenovaFit',
  description:
    'IA avalia a qualidade das interações com alunos e sugere melhorias, scripts de vendas e próximos contatos.',
};

export const dynamic = 'force-dynamic';

export default function AnalisePage() {
  return <AnalisePageClient />;
}
