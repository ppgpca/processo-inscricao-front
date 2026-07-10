import React, { createContext, useContext, useReducer, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext();

export { AuthContext };

const initialState = {
	usuario: null,
	token: localStorage.getItem('auth_token') || null,
	permissoesUsuario: [],
	gruposUsuario: [],
	temConsultaTodos: false,
	isAuthenticated: false,
	loading: true,
};

const authReducer = (state, action) => {
	switch (action.type) {
		case 'LOGIN_START':
			return { ...state, loading: true };
		case 'LOGIN_SUCCESS':
			return {
				...state,
				usuario: action.payload.usuario,
				token: action.payload.token,
				isAuthenticated: true,
				loading: false,
			};
		case 'LOGIN_FAILURE':
			return {
				...state,
				usuario: null,
				token: null,
				permissoesUsuario: [],
				gruposUsuario: [],
				temConsultaTodos: false,
				isAuthenticated: false,
				loading: false,
			};
		case 'LOGOUT':
			return {
				...state,
				usuario: null,
				token: null,
				permissoesUsuario: [],
				gruposUsuario: [],
				temConsultaTodos: false,
				isAuthenticated: false,
				loading: false,
			};
		case 'SET_PERMISSOES':
			return {
				...state,
				permissoesUsuario: action.payload.permissoesUsuario,
				gruposUsuario: action.payload.gruposUsuario || [],
				temConsultaTodos: action.payload.temConsultaTodos,
			};
		case 'SET_LOADING':
			return { ...state, loading: action.payload };
		default:
			return state;
	}
};

export const AuthProvider = ({ children }) => {
	const [state, dispatch] = useReducer(authReducer, initialState);

	const login = async (userId, senha) => {
		try {
			dispatch({ type: 'LOGIN_START' });
			const resultado = await authService.login(userId, senha);

			localStorage.setItem('auth_token', resultado.token);

			dispatch({
				type: 'LOGIN_SUCCESS',
				payload: {
					usuario: resultado.usuario,
					token: resultado.token,
				},
			});

			await carregarPermissoes();
			return { success: true };
		} catch (error) {
			dispatch({ type: 'LOGIN_FAILURE' });
			return { success: false, error: error.message };
		}
	};

	const logout = () => {
		localStorage.removeItem('auth_token');
		dispatch({ type: 'LOGOUT' });
	};

	const carregarPermissoes = async () => {
		try {
			const dadosUsuario = await authService.getMe();

			dispatch({
				type: 'SET_PERMISSOES',
				payload: {
					permissoesUsuario: dadosUsuario.permissoes || [],
					gruposUsuario: dadosUsuario.grupos || [],
					temConsultaTodos: dadosUsuario.temConsultaTodos || false,
				},
			});
		} catch (error) {
			console.error('Erro ao carregar permissões:', error);
		}
	};

	const verificarPermissao = (nomePermissao) => {
		if (!state.permissoesUsuario || state.permissoesUsuario.length === 0) {
			return false;
		}

		return state.permissoesUsuario.find((p) => p.id === nomePermissao);
	};

	const verificarAutenticacao = async () => {
		const token = localStorage.getItem('auth_token');

		if (!token) {
			dispatch({ type: 'SET_LOADING', payload: false });
			return;
		}

		try {
			const dadosUsuario = await authService.getMe();
			dispatch({
				type: 'LOGIN_SUCCESS',
				payload: {
					usuario: dadosUsuario,
					token: token,
				},
			});
			await carregarPermissoes();
		} catch (error) {
			localStorage.removeItem('auth_token');
			dispatch({ type: 'LOGIN_FAILURE' });
		} finally {
			dispatch({ type: 'SET_LOADING', payload: false });
		}
	};

	useEffect(() => {
		verificarAutenticacao();
	}, []);

	const value = {
		...state,
		login,
		logout,
		verificarPermissao,
		carregarPermissoes,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (!context) {
		throw new Error('useAuth deve ser usado dentro de um AuthProvider');
	}
	return context;
};
