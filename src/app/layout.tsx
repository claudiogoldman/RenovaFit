import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'RenovaFit - IA para Academias',
  description:
    'Ecossistema de IA para conversão, retenção e reativação de alunos em academias',
  icons: {
    icon: [
      { url: '/image/logo/favicon_renovafit.png', type: 'image/png' },
      { url: '/image/logo/logo-renovafit.png', type: 'image/png' },
    ],
    shortcut: ['/image/logo/favicon_renovafit.png'],
    apple: [{ url: '/image/logo/favicon_renovafit.png' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="bg-slate-950 text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
