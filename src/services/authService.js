import axiosInstance from '../auth/axios.js';

export async function login(userId, senha) {
	try {
		const response = await axiosInstance.post('/auth/login', { userId, senha });
		return response;
	} catch (error) {
		throw new Error(
			error.response?.data?.message || error.message || 'Erro ao conectar com o servidor',
		);
	}
}

export async function logout() {
	try {
		await axiosInstance.post('/auth/logout');
	} catch (error) {
		console.error('Erro no logout:', error);
	}
}

export async function getMe() {
	try {
		const response = await axiosInstance.get('/auth/me');
		return response.usuario;
	} catch (error) {
		throw new Error(
			error.response?.data?.message || error.message || 'Erro ao conectar com o servidor',
		);
	}
}

export async function refreshToken() {
	try {
		const token = localStorage.getItem('auth_token');

		if (!token) {
			throw new Error('Token não encontrado');
		}

		const response = await axiosInstance.post('/auth/refresh', { token });
		localStorage.setItem('auth_token', response.token);
		return response.token;
	} catch (error) {
		throw new Error(
			error.response?.data?.message || error.message || 'Erro ao conectar com o servidor',
		);
	}
}

export async function validateToken() {
	try {
		const token = localStorage.getItem('auth_token');

		if (!token) {
			return false;
		}

		await axiosInstance.post('/auth/validate', { token });
		return true;
	} catch (error) {
		return false;
	}
}

export function getToken() {
	return localStorage.getItem('auth_token');
}

export function setToken(token) {
	localStorage.setItem('auth_token', token);
}

export function removeToken() {
	localStorage.removeItem('auth_token');
}

export function isTokenExpired(token) {
	if (!token) return true;

	try {
		const payload = JSON.parse(atob(token.split('.')[1]));
		const currentTime = Date.now() / 1000;
		return payload.exp < currentTime;
	} catch (error) {
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
