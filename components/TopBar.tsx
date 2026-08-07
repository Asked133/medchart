'use client'
// components/TopBar.tsx
// Barra superior de la app protegida.
// Muestra nombre del médico, estado de conexión y botón de logout.

import { useState, useEffect, useTransition } from 'react'
import { logout } from '@/app/actions/auth'
import { useOnlineStatus } from '@/lib/hooks/useOnlineStatus'
import { useTheme } from '@/lib/hooks/useTheme'
import { Stethoscope, Wifi, WifiOff, LogOut, ChevronDown, Sun, Moon } from 'lucide-react'

interface TopBarProps {
  doctorName: string
  specialtyTitle: string
}

export default function TopBar({ doctorName, specialtyTitle }: TopBarProps) {
  const isOnline = useOnlineStatus()
  const { theme, toggleTheme } = useTheme()
  const [isPending, startTransition] = useTransition()
  const [menuOpen, setMenuOpen] = useState(false)

  // Cerrar el menú al hacer click fuera de él
  useEffect(() => {
    if (!menuOpen) return
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement
      if (!target.closest('#btn-user-menu') && !target.closest('.user-menu-dropdown')) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [menuOpen])

  function handleLogout() {
    startTransition(async () => {
      await logout()
    })
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface/80 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-brand-muted flex items-center justify-center border border-brand/20">
            <Stethoscope className="w-4 h-4 text-brand-text" />
          </div>
          <span className="font-semibold text-foreground text-sm tracking-tight hidden sm:block">
            MedChart
          </span>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Botón de Modo Claro / Modo Oscuro */}
          <button
            type="button"
            onClick={toggleTheme}
            className="
              flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
              bg-surface hover:bg-surface-hover border border-border-strong
              text-foreground transition-all duration-200 shadow-clinical-sm
            "
            title={theme === 'dark' ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? (
              <>
                <Sun className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="hidden sm:inline text-amber-300 font-semibold">Modo Claro</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-brand-text shrink-0" />
                <span className="hidden sm:inline text-foreground-muted font-medium">Modo Oscuro</span>
              </>
            )}
          </button>

          {/* Indicador de conexión */}
          <div
            className={`
              flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full transition-all duration-500
              ${isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse'
              }
            `}
            title={isOnline ? 'Conectado' : 'Sin conexión — los cambios se guardan localmente'}
          >
            {isOnline
              ? <Wifi className="w-3 h-3" />
              : <WifiOff className="w-3 h-3" />
            }
            <span className="hidden sm:block">
              {isOnline ? 'En línea' : 'Sin conexión'}
            </span>
          </div>

          {/* Perfil / Logout */}
          <div className="relative">
            <button
              id="btn-user-menu"
              onClick={() => setMenuOpen(!menuOpen)}
              className="
                flex items-center gap-2 px-3 py-1.5 rounded-xl
                text-foreground-muted hover:text-foreground hover:bg-surface-hover
                border border-transparent hover:border-border-subtle
                transition-all duration-200 text-sm
              "
            >
              <div className="w-7 h-7 rounded-full bg-brand/10 border border-brand/30 flex items-center justify-center text-brand-text text-xs font-semibold">
                {doctorName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-medium text-foreground leading-tight">{doctorName}</div>
                <div className="text-[10px] text-foreground-muted leading-tight">{specialtyTitle}</div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${menuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <div className="user-menu-dropdown absolute right-0 top-full mt-2 w-48 bg-surface border border-border-subtle rounded-xl shadow-clinical py-1 z-50">
                <div className="px-3 py-2 border-b border-border-subtle md:hidden">
                  <p className="text-xs font-medium text-foreground">{doctorName}</p>
                  <p className="text-[10px] text-foreground-muted">{specialtyTitle}</p>
                </div>
                <button
                  id="btn-logout"
                  onClick={handleLogout}
                  disabled={isPending}
                  className="
                    w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground-muted
                    hover:text-foreground hover:bg-surface-hover transition-colors duration-150
                    disabled:opacity-50
                  "
                >
                  <LogOut className="w-4 h-4" />
                  {isPending ? 'Cerrando sesión…' : 'Cerrar sesión'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
