'use client'

import { useState, useEffect } from 'react'

export type Theme = 'dark' | 'light'

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    // Leer preferencia guardada o abrir en blanco (light) por primera vez
    const savedTheme = localStorage.getItem('medchart_theme') as Theme | null
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme)
      applyTheme(savedTheme)
    } else {
      const initial: Theme = 'light'
      setTheme(initial)
      applyTheme(initial)
    }
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
    localStorage.setItem('medchart_theme', nextTheme)
    applyTheme(nextTheme)
  }

  return { theme, toggleTheme }
}
