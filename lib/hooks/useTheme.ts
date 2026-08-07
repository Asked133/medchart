'use client'

import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    // Usar la clave v2 para asegurar que abra en Modo Claro (Luz) la primera vez
    let savedTheme = localStorage.getItem('medchart_theme_v2') as Theme | null
    if (!savedTheme) {
      savedTheme = 'light'
      localStorage.setItem('medchart_theme_v2', 'light')
    }

    setTheme(savedTheme)
    applyTheme(savedTheme)
  }, [])

  function applyTheme(newTheme: Theme) {
    const root = document.documentElement
    if (newTheme === 'light') {
      root.classList.remove('dark')
      root.classList.add('light')
      root.setAttribute('data-theme', 'light')
    } else {
      root.classList.remove('light')
      root.classList.add('dark')
      root.setAttribute('data-theme', 'dark')
    }
  }

  function toggleTheme() {
    const nextTheme: Theme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    localStorage.setItem('medchart_theme_v2', nextTheme)
    applyTheme(nextTheme)
  }

  return { theme, toggleTheme }
}
