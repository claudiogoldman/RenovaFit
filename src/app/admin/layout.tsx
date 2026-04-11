import { ReactNode } from 'react';
import { AppLogo } from '@/components/layout/AppLogo';

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center min-h-16 py-2">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 shrink-0">
                <AppLogo size="sm" />
                <h1 className="text-lg font-bold text-gray-900 leading-none">Admin</h1>
              </div>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                <a
                  href="/admin"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Dashboard
                </a>
                <a
                  href="/admin/empresas"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Empresas
                </a>
                <a
                  href="/admin/filiais"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Filiais
                </a>
                <a
                  href="/admin/usuarios"
                  className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                >
                  Usuários
                </a>
                  <a
                    href="/admin/renovacoes"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Renovações
                  </a>
                  <a
                    href="/admin/configuracoes"
                    className="text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium"
                  >
                    Configurações
                  </a>
              </div>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {children}
      </main>
    </div>
  );
}
