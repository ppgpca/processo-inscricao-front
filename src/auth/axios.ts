import axios from "axios";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import authService from "../services/authService";

interface RetryableConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
}

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api";

const axiosInstance = axios.create({
	baseURL: API_URL,
	timeout: 10000,
	headers: {
		"Content-Type": "application/json",
	},
});

function onFulfilledRequest(
	config: InternalAxiosRequestConfig,
): InternalAxiosRequestConfig {
	const token = authService.getToken();
	if (token) {
		config.headers.Authorization = `Bearer ${token}`;
	}
	return config;
}

function handleRequestError(error: unknown): Promise<never> {
	return Promise.reject(error);
}

function onFulfilledResponse(response: AxiosResponse): unknown {
	return response.data;
}

async function handleResponseError(error: unknown): Promise<never> {
	const err = error as {
		config?: RetryableConfig;
		response?: { status: number };
		message?: string;
	};
	const originalRequest = err.config;

	if (
		err.response?.status === 401 &&
		originalRequest &&
		!originalRequest._retry
	) {
		originalRequest._retry = true;
		const token = authService.getToken();
		if (token && !authService.isTokenExpired(token)) {
			try {
				const newToken = await authService.refreshToken();
				originalRequest.headers.Authorization = `Bearer ${newToken}`;
				return axiosInstance(originalRequest) as Promise<never>;
			} catch {
				authService.removeToken();
				window.location.href = "/login";
				return Promise.reject(
					new Error("Sessão expirada. Faça login novamente."),
				);
			}
		} else {
			authService.removeToken();
			window.location.href = "/login";
			return Promise.reject(
				new Error("Sessão expirada. Faça login novamente."),
			);
		}
	}
	return Promise.reject(error);
}

axiosInstance.interceptors.request.use(onFulfilledRequest, handleRequestError);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
axiosInstance.interceptors.response.use(
	onFulfilledResponse as any,
	handleResponseError,
);

export default axiosInstance;
