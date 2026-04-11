'use client'

import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { ReactNode } from 'react'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', exact: true },
  { href: '/admin/empresas', label: 'Empresas' },
  { href: '/admin/filiais', label: 'Filiais' },
  { href: '/admin/usuarios', label: 'Usuários' },
  { href: '/admin/renovacoes', label: 'Renovações' },
  { href: '/admin/configuracoes', label: 'Configurações' },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <a href="/admin" className="text-lg font-bold text-gray-900 shrink-0">
              RenovaFit Admin
            </a>

            {/* Desktop links */}
            <div className="hidden md:flex items-center gap-1">
              {ADMIN_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.href, link.exact)
                      ? 'text-gray-900 bg-gray-100'
                      : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  {link.label}
                </a>
              ))}
            </div>

            {/* Desktop app link */}
            <a
              href="/retencao"
              className="hidden md:inline-flex text-sm text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-2 transition-colors"
            >
              ← App
            </a>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
              aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
            >
              {menuOpen ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-1">
            {ADMIN_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  isActive(link.href, link.exact)
                    ? 'text-gray-900 bg-gray-100'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {link.label}
              </a>
            ))}
            <div className="border-t border-gray-100 pt-2 mt-1">
              <a
                href="/retencao"
                onClick={() => setMenuOpen(false)}
                className="flex px-3 py-3 rounded-lg text-sm text-gray-500 hover:text-gray-900 hover:bg-gray-50 transition-colors"
              >
                ← Voltar ao App
              </a>
            </div>
          </div>
        )}
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
