import axiosInstance from "../auth/axios";
import type { Usuario } from "../types";

interface LoginResponse {
	token: string;
	usuario: Usuario;
}

interface RefreshResponse {
	token: string;
}

export async function login(
	userId: string,
	senha: string,
): Promise<LoginResponse> {
	try {
		const response = (await axiosInstance.post("/auth/login", {
			userId,
			senha,
		})) as LoginResponse;
		return response;
	} catch (error) {
		const err = error as {
			response?: { data?: { message?: string } };
			message?: string;
		};
		throw new Error(
			err.response?.data?.message ??
				err.message ??
				"Erro ao conectar com o servidor",
		);
	}
}

export async function logout(): Promise<void> {
	try {
		await axiosInstance.post("/auth/logout");
	} catch (error) {
		console.error("Erro no logout:", error);
	}
}

export async function getMe(): Promise<Usuario> {
	try {
		const response = (await axiosInstance.get("/auth/me")) as {
			usuario: Usuario;
		};
		return response.usuario;
	} catch (error) {
		const err = error as {
			response?: { data?: { message?: string } };
			message?: string;
		};
		throw new Error(
			err.response?.data?.message ??
				err.message ??
				"Erro ao conectar com o servidor",
		);
	}
}

export async function refreshToken(): Promise<string> {
	try {
		const token = localStorage.getItem("auth_token");

		if (!token) {
			throw new Error("Token não encontrado");
		}

		const response = (await axiosInstance.post("/auth/refresh", {
			token,
		})) as RefreshResponse;
		localStorage.setItem("auth_token", response.token);
		return response.token;
	} catch (error) {
		const err = error as {
			response?: { data?: { message?: string } };
			message?: string;
		};
		throw new Error(
			err.response?.data?.message ??
				err.message ??
				"Erro ao conectar com o servidor",
		);
	}
}

export async function validateToken(): Promise<boolean> {
	try {
		const token = localStorage.getItem("auth_token");

		if (!token) {
			return false;
		}

		await axiosInstance.post("/auth/validate", { token });
		return true;
	} catch {
		return false;
	}
}

export function getToken(): string | null {
	return localStorage.getItem("auth_token");
}

export function setToken(token: string): void {
	localStorage.setItem("auth_token", token);
}

export function removeToken(): void {
	localStorage.removeItem("auth_token");
}

export function isTokenExpired(token: string): boolean {
	if (!token) return true;

	try {
		const payload = JSON.parse(atob(token.split(".")[1])) as {
			exp: number;
		};
		const currentTime = Date.now() / 1000;
		return payload.exp < currentTime;
	} catch {
		return true;
	}
}

const authService = {
	login,
	logout,
	getMe,
	refreshToken,
	validateToken,
	getToken,
	setToken,
	removeToken,
	isTokenExpired,
};

export default authService;
