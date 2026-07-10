export function validateLoginForm(userId, senha) {
	const errors = [];

	if (!userId) errors.push('ID do usuário é obrigatório');
	if (!senha) errors.push('Senha é obrigatória');

	if (errors.length > 0) {
		return {
			isValid: false,
			message: errors.join(' e '),
		};
	}

	return { isValid: true };
}

export function getResetLoginFormData() {
	return {
		userId: '',
		senha: '',
	};
}

export function processLoginResult(resultado) {
	if (resultado.success) {
		return {
			success: true,
			error: null,
		};
	}

	return {
		success: false,
		error: resultado.error || 'Erro ao fazer login',
	};
}

export function handleLoginError(error) {
	return error.message || 'Erro ao fazer login';
}

const loginController = {
	validateLoginForm,
	getResetLoginFormData,
	processLoginResult,
	handleLoginError,
};

export default loginController;
