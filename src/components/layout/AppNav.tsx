'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'

const NAV_LINKS = [
  { href: '/conversao', label: 'Conversão', activeColor: 'text-cyan-400', icon: '🎯' },
  { href: '/retencao', label: 'Retenção', activeColor: 'text-emerald-400', icon: '💚' },
  { href: '/reativacao', label: 'Reativação', activeColor: 'text-purple-400', icon: '🔄' },
]

export function AppNav() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  async function handleSignOut() {
    try {
      const supabase = createSupabaseBrowserClient()
      await supabase.auth.signOut()
    } catch {
      // ignore
    }
    window.location.href = '/login'
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link href="/" className="text-lg font-bold text-white shrink-0">
            RenovaFit
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const active = pathname.startsWith(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? `${link.activeColor} bg-slate-800`
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <span>{link.icon}</span>
                  {link.label}
                </Link>
              )
            })}
          </div>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            <Link
              href="/admin"
              className="text-sm text-slate-400 hover:text-white px-3 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              ⚙️ Admin
            </Link>
            <button
              onClick={() => void handleSignOut()}
              className="text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-2 transition-colors"
            >
              Sair
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="md:hidden text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-800 transition-colors"
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
        <div className="md:hidden border-t border-slate-800 bg-slate-950 px-4 py-3 space-y-1">
          {NAV_LINKS.map((link) => {
            const active = pathname.startsWith(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-3 rounded-lg text-sm font-medium transition-colors ${
                  active
                    ? `${link.activeColor} bg-slate-800`
                    : 'text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                <span>{link.icon}</span>
                {link.label}
              </Link>
            )
          })}
          <div className="border-t border-slate-800 pt-2 mt-2 flex gap-2">
            <Link
              href="/admin"
              onClick={() => setMenuOpen(false)}
              className="flex-1 text-center px-3 py-2.5 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            >
              ⚙️ Admin
            </Link>
            <button
              onClick={() => void handleSignOut()}
              className="flex-1 text-sm text-slate-400 hover:text-white border border-slate-700 rounded-lg px-3 py-2.5 transition-colors"
            >
              Sair
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
