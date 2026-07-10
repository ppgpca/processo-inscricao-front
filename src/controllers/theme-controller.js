/**
 * Valida se o modo de tema é válido
 */
export function isValidThemeMode(mode) {
	return mode === 'light' || mode === 'dark'
}

/**
 * Obtém o modo padrão do tema
 */
export function getDefaultThemeMode() {
	return 'light'
}

/**
 * Processa e valida o tema recuperado do storage
 */
export function processStoredTheme(storedTheme) {
	if (storedTheme && isValidThemeMode(storedTheme)) {
		return storedTheme
	}
	return getDefaultThemeMode()
}

/**
 * Alterna entre os modos de tema
 */
export function getToggledThemeMode(currentMode) {
	return currentMode === 'light' ? 'dark' : 'light'
}

const themeController = {
	isValidThemeMode,
	getDefaultThemeMode,
	processStoredTheme,
	getToggledThemeMode,
}

export default themeController
