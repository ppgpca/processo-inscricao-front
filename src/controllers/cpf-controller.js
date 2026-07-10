/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function formatarCpf(valor) {
	const digits = valor.replace(/\D/g, '').slice(0, 11)
	return digits
		.replace(/(\d{3})(\d)/, '$1.$2')
		.replace(/(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
		.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, '$1.$2.$3-$4')
}

/**
 * Remove formatação do CPF, retornando apenas dígitos
 */
export function limparCpf(cpf) {
	return cpf.replace(/\D/g, '')
}

/**
 * Valida se o CPF possui exatamente 11 dígitos
 */
export function validarCpfDigitos(cpf) {
	const digits = limparCpf(cpf)
	if (digits.length !== 11) {
		return { valido: false, erro: 'Informe um CPF válido com 11 dígitos.' }
	}
	return { valido: true, erro: null }
}

/**
 * Verifica se a inscrição está finalizada (enviada ou etapa >= 5)
 */
export function isInscricaoFinalizada(insc) {
	if (!insc) return false
	return insc.status === 'enviada' || !!insc.dataEnvio || (insc.etapa ?? 0) >= 5
}

/**
 * Obtém o label descritivo de uma etapa pelo número
 */
export function obterLabelEtapa(etapa) {
	const labels = {
		1: 'Linha de Pesquisa',
		2: 'Dados Pessoais',
		3: 'Formação',
		4: 'Documentos',
	}
	return labels[etapa] ?? `Etapa ${etapa}`
}

/**
 * Valida se a confirmação do número de inscrição está correta
 */
export function validarConfirmacaoNumeroInscricao(confirmacao, inscricaoId) {
	if (!inscricaoId) return false
	return confirmacao.trim() === String(inscricaoId)
}

/**
 * Obtém o texto de status de uma inscrição existente para exibição
 */
export function obterTextoStatusInscricao(insc) {
	if (!insc) return null
	if (isInscricaoFinalizada(insc)) return 'enviada'
	return 'em andamento'
}

const cpfController = {
	formatarCpf,
	limparCpf,
	validarCpfDigitos,
	isInscricaoFinalizada,
	obterLabelEtapa,
	validarConfirmacaoNumeroInscricao,
	obterTextoStatusInscricao,
}

export default cpfController
