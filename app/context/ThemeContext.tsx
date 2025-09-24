'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'claro' | 'escuro' | 'sistema'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider = ({ initialTheme, children }: { initialTheme: Theme, children: React.ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(initialTheme)

  useEffect(() => {
    const html = document.documentElement

    const applyTheme = (value: Theme) => {
      if (value === 'escuro') {
        html.classList.add('dark')
      } else if (value === 'claro') {
        html.classList.remove('dark')
      } else {
        // sistema
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        if (systemPrefersDark) {
          html.classList.add('dark')
        } else {
          html.classList.remove('dark')
        }
      }
    }

    applyTheme(theme)
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme deve estar dentro de ThemeProvider')
  return context
}
