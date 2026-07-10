export const ANO_MIN = 1950
export const ANO_MAX = new Date().getFullYear() + 1

/**
 * Aplica máscara de telefone (fixo ou celular)
 */
export function aplicarMascaraTelefone(valor) {
	const digits = valor.replace(/\D/g, '').slice(0, 11)
	if (digits.length <= 10) {
		return digits
			.replace(/^(\d{0,2})/, '($1')
			.replace(/^(\(\d{2})(\d)/, '$1) $2')
			.replace(/(\d{4})(\d{1,4})$/, '$1-$2')
	}
	return digits
		.replace(/^(\d{0,2})/, '($1')
		.replace(/^(\(\d{2})(\d)/, '$1) $2')
		.replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

/**
 * Valida o ano de conclusão da graduação
 * Retorna string de erro ou null se válido
 */
export function validarAno(valor) {
	if (!valor) return null
	const ano = Number(valor)
	if (ano < ANO_MIN) return `Ano não pode ser anterior a ${ANO_MIN}`
	if (ano > ANO_MAX) return `Ano não pode ser posterior a ${ANO_MAX}`
	return null
}

/**
 * Valida os campos obrigatórios dos dados de formação
 */
export function validarDadosFormacao(dados) {
	const g1 = dados.graduacao1 ?? {}
	const errors = []

	if (!g1.curso) errors.push('Curso da Graduação 1 é obrigatório')
	if (!g1.instituicao) errors.push('Instituição da Graduação 1 é obrigatória')
	if (!g1.anoConclusao) errors.push('Ano de Conclusão da Graduação 1 é obrigatório')
	else if (validarAno(g1.anoConclusao)) errors.push(validarAno(g1.anoConclusao))

	const g2 = dados.graduacao2 ?? {}
	if (g2.anoConclusao && validarAno(g2.anoConclusao)) {
		errors.push(validarAno(g2.anoConclusao))
	}

	if (errors.length > 0) {
		return { isValid: false, message: errors.join('. ') }
	}

	return { isValid: true }
}

/**
 * Verifica se a graduação 1 obrigatória está preenchida (para habilitar o botão Próximo)
 */
export function isDadosFormacaoValidos(dados) {
	const g1 = dados.graduacao1 ?? {}
	return !!(g1.curso && g1.instituicao && g1.anoConclusao)
}

/**
 * Retorna o estado inicial dos dados complementares
 */
export function getInitialDadosComplementares() {
	return {
		graduacao1: { curso: '', instituicao: '', anoConclusao: '' },
		graduacao2: { curso: '', instituicao: '', anoConclusao: '' },
		ocupacaoProfissional: { instituicao: '', cargo: '', telefone: '' },
	}
}

/**
 * Carrega dados complementares a partir de uma fonte (inscrição existente ou histórico)
 */
export function carregarDadosComplementares(dc) {
	if (!dc) return getInitialDadosComplementares()
	return {
		graduacao1: dc.graduacao1 ?? { curso: '', instituicao: '', anoConclusao: '' },
		graduacao2: dc.graduacao2 ?? { curso: '', instituicao: '', anoConclusao: '' },
		ocupacaoProfissional: dc.ocupacaoProfissional ?? { instituicao: '', cargo: '', telefone: '' },
	}
}

const formacaoController = {
	ANO_MIN,
	ANO_MAX,
	aplicarMascaraTelefone,
	validarAno,
	validarDadosFormacao,
	isDadosFormacaoValidos,
	getInitialDadosComplementares,
	carregarDadosComplementares,
}

export default formacaoController
