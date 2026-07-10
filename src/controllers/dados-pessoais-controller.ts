import type { Candidato, DadosPessoais } from '../types'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Aplica máscara de telefone fixo: (XX) XXXX-XXXX
 */
export function formatTelefone(valor: string): string {
	const d = valor.replace(/\D/g, '').slice(0, 10)
	if (d.length === 0) return ''
	if (d.length <= 2) return `(${d}`
	if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
	return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
}

/**
 * Aplica máscara de celular: (XX) XXXXX-XXXX
 */
export function formatCelular(valor: string): string {
	const d = valor.replace(/\D/g, '').slice(0, 11)
	if (d.length === 0) return ''
	if (d.length <= 2) return `(${d}`
	if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
	return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

/**
 * Aplica máscara de CEP: 00000-000
 */
export function formatCep(valor: string): string {
	const digits = valor.replace(/\D/g, '').slice(0, 8)
	if (digits.length <= 5) return digits
	return digits.replace(/^(\d{5})(\d{0,3})/, '$1-$2')
}

/**
 * Remove caracteres inválidos de e-mail (espaços, ponto-e-vírgula etc.)
 */
export function sanitizeEmail(valor: string): string {
	return valor.replace(/[\s;,<>'"\\]/g, '')
}

/**
 * Valida o formato do e-mail
 */
export function validarFormatoEmail(email: string): boolean {
	if (!email) return true
	return EMAIL_REGEX.test(email)
}

/**
 * Valida os campos obrigatórios dos dados pessoais
 */
export function validarDadosPessoais(
	dados: DadosPessoais,
	emailConfirmValido: boolean,
): { isValid: boolean; message?: string } {
	const emailValido = !!dados.email && validarFormatoEmail(dados.email)
	const email2Valido = !dados.email2 || validarFormatoEmail(dados.email2)

	const errors: string[] = []
	if (!dados.nome) errors.push('Nome é obrigatório')
	if (!dados.dataNascimento) errors.push('Data de nascimento é obrigatória')
	if (!dados.email) errors.push('E-mail é obrigatório')
	else if (!emailValido) errors.push('E-mail inválido')
	if (!email2Valido) errors.push('E-mail alternativo inválido')
	if (!emailConfirmValido) errors.push('Confirmação de e-mail inválida')

	if (errors.length > 0) {
		return { isValid: false, message: errors.join('. ') }
	}

	return { isValid: true }
}

/**
 * Verifica se os dados pessoais obrigatórios estão preenchidos (para habilitar o botão Próximo)
 */
export function isDadosPessoaisValidos(dados: DadosPessoais, emailConfirmValido: boolean): boolean {
	const emailValido = !!dados.email && validarFormatoEmail(dados.email)
	const email2Valido = !dados.email2 || validarFormatoEmail(dados.email2)
	return !!(dados.nome && dados.dataNascimento && emailValido && email2Valido && emailConfirmValido)
}

/**
 * Prepara o payload do candidato para envio à API
 * Remove campos opcionais vazios
 */
export function prepararPayloadCandidato(cpf: string, dados: DadosPessoais): Partial<Candidato> {
	return {
		cpf,
		nome: dados.nome,
		dataNascimento: dados.dataNascimento,
		rg: dados.rg || undefined,
		telefone: dados.telefone || undefined,
		celular: dados.celular || undefined,
		email: dados.email,
		email2: dados.email2 || undefined,
		enderecoRua: dados.enderecoRua || undefined,
		enderecoNum: dados.enderecoNum || undefined,
		enderecoBairro: dados.enderecoBairro || undefined,
		enderecoCidade: dados.enderecoCidade || undefined,
		enderecoEstado: dados.enderecoEstado || undefined,
		enderecoCep: dados.enderecoCep || undefined,
	}
}

/**
 * Retorna o estado inicial dos dados pessoais
 */
export function getInitialDadosPessoais(): DadosPessoais {
	return {
		nome: '',
		dataNascimento: '',
		rg: '',
		telefone: '',
		celular: '',
		email: '',
		email2: '',
		enderecoRua: '',
		enderecoNum: '',
		enderecoBairro: '',
		enderecoCidade: '',
		enderecoEstado: '',
		enderecoCep: '',
	}
}

/**
 * Carrega dados pessoais a partir de um candidato existente
 */
export function carregarDadosPessoaisExistentes(cand: Candidato | null): DadosPessoais {
	if (!cand) return getInitialDadosPessoais()
	return {
		nome: cand.nome ?? '',
		dataNascimento: cand.dataNascimento ?? '',
		rg: cand.rg ?? '',
		telefone: cand.telefone ?? '',
		celular: cand.celular ?? '',
		email: cand.email ?? '',
		email2: cand.email2 ?? '',
		enderecoRua: cand.enderecoRua ?? '',
		enderecoNum: cand.enderecoNum ?? '',
		enderecoBairro: cand.enderecoBairro ?? '',
		enderecoCidade: cand.enderecoCidade ?? '',
		enderecoEstado: cand.enderecoEstado ?? '',
		enderecoCep: cand.enderecoCep ?? '',
	}
}

const dadosPessoaisController = {
	formatTelefone,
	formatCelular,
	formatCep,
	sanitizeEmail,
	validarFormatoEmail,
	validarDadosPessoais,
	isDadosPessoaisValidos,
	prepararPayloadCandidato,
	getInitialDadosPessoais,
	carregarDadosPessoaisExistentes,
}

export default dadosPessoaisController
