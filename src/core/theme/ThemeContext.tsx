import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'dark' | 'warm'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('diumed_theme')
    return (saved as Theme) || 'dark'
  })

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('diumed_theme', newTheme)
  }

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'warm' : 'dark')
  }

  useEffect(() => {
    const root = document.documentElement
    if (theme === 'warm') {
      root.classList.add('theme-warm')
    } else {
      root.classList.remove('theme-warm')
    }
  }, [theme])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
