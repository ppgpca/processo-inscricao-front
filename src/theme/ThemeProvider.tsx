import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material'
import type { ThemeMode } from '../types'
import { createMuiTheme } from './createMuiTheme'

const THEME_STORAGE_KEY = 'theme'

interface ThemeContextValue {
	mode: ThemeMode
	toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
	mode: 'light',
	toggleTheme: () => {},
})

function getStoredTheme(): ThemeMode {
	try {
		const stored = localStorage.getItem(THEME_STORAGE_KEY)
		if (stored === 'light' || stored === 'dark') return stored
	} catch {
		/* ignore */
	}
	return 'light'
}

export function useThemeContext() {
	return useContext(ThemeContext)
}

export default function AppThemeProvider({ children }: { children: ReactNode }) {
	const [mode, setMode] = useState<ThemeMode>(getStoredTheme)

	const toggleTheme = useCallback(() => {
		setMode((prevMode) => {
			const newMode = prevMode === 'light' ? 'dark' : 'light'
			try {
				localStorage.setItem(THEME_STORAGE_KEY, newMode)
			} catch {
				/* ignore */
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
