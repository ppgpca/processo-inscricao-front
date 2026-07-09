import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material'
import { createMuiTheme } from './createMuiTheme.js'

const THEME_STORAGE_KEY = 'theme'

const ThemeContext = createContext({
  mode: 'light',
  toggleTheme: () => {},
})

function getStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY)
    if (stored === 'light' || stored === 'dark') {
      return stored
    }
  } catch {
    // ignore storage errors
  }
  return 'light'
}

export function useThemeContext() {
  return useContext(ThemeContext)
}

export default function AppThemeProvider({ children }) {
  const [mode, setMode] = useState(getStoredTheme)

  const toggleTheme = useCallback(() => {
    setMode((prevMode) => {
      const newMode = prevMode === 'light' ? 'dark' : 'light'
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newMode)
      } catch {
        // ignore storage errors
      }
      return newMode
    })
  }, [])

  const theme = useMemo(() => createMuiTheme(mode), [mode])
  const contextValue = useMemo(() => ({ mode, toggleTheme }), [mode, toggleTheme])

  return (
    <ThemeContext.Provider value={contextValue}>
      <MuiThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeContext.Provider>
  )
}
