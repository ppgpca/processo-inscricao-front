import type { ThemeMode } from "../types";

/**
 * Valida se o modo de tema é válido
 */
export function isValidThemeMode(mode: string): mode is ThemeMode {
	return mode === "light" || mode === "dark";
}

/**
 * Obtém o modo padrão do tema
 */
export function getDefaultThemeMode(): ThemeMode {
	return "light";
}

/**
 * Processa e valida o tema recuperado do storage
 */
export function processStoredTheme(storedTheme: string | null): ThemeMode {
	if (storedTheme && isValidThemeMode(storedTheme)) {
		return storedTheme;
	}
	return getDefaultThemeMode();
}

/**
 * Alterna entre os modos de tema
 */
export function getToggledThemeMode(currentMode: ThemeMode): ThemeMode {
	return currentMode === "light" ? "dark" : "light";
}

const themeController = {
	isValidThemeMode,
	getDefaultThemeMode,
	processStoredTheme,
	getToggledThemeMode,
};

export default themeController;
