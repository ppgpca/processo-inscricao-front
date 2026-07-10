/**
 * Retorna o estado inicial do projeto de pesquisa
 */
export function getInitialProjetoPesquisa() {
	return {
		idLinhaPesquisa: '',
		projetoPesquisa: '',
		deficiente: false,
		indigena: false,
		pretoPardo: false,
	}
}

/**
 * Verifica se os campos obrigatórios do projeto de pesquisa estão preenchidos
 */
export function isProjetoPesquisaValido(dados) {
	return !!(dados.idLinhaPesquisa && dados.projetoPesquisa)
}

/**
 * Valida os dados do projeto de pesquisa retornando detalhes
 */
export function validarProjetoPesquisa(dados) {
	const errors = []

	if (!dados.idLinhaPesquisa) errors.push('Linha de pesquisa é obrigatória')
	if (!dados.projetoPesquisa) errors.push('Título do projeto é obrigatório')

	if (errors.length > 0) {
		return { isValid: false, message: errors.join('. ') }
	}

	return { isValid: true }
}

/**
 * Prepara o payload do projeto de pesquisa para envio à API
 * Remove campos opcionais vazios
 */
export function prepararPayloadProjetoPesquisa(dados) {
	return {
		idLinhaPesquisa: dados.idLinhaPesquisa ? Number(dados.idLinhaPesquisa) : undefined,
		projetoPesquisa: dados.projetoPesquisa || undefined,
		deficiente: dados.deficiente,
		indigena: dados.indigena,
		pretoPardo: dados.pretoPardo,
	}
}

/**
 * Carrega dados do projeto de pesquisa a partir de uma inscrição existente
 */
export function carregarProjetoPesquisaExistente(insc) {
	if (!insc) return getInitialProjetoPesquisa()
	return {
		idLinhaPesquisa: insc.idLinhaPesquisa ?? '',
		projetoPesquisa: insc.projetoPesquisa ?? '',
		deficiente: insc.deficiente ?? false,
		indigena: insc.indigena ?? false,
		pretoPardo: insc.pretoPardo ?? false,
	}
}

/**
 * Obtém as cotas selecionadas como array de labels
 */
export function obterCotasSelecionadas(dados) {
	const cotas = []
	if (dados.deficiente) cotas.push('Pessoa com deficiência (PcD)')
	if (dados.indigena) cotas.push('Pessoa indígena')
	if (dados.pretoPardo) cotas.push('Pessoa preta ou parda')
	return cotas
}

const projetoPesquisaController = {
	getInitialProjetoPesquisa,
	isProjetoPesquisaValido,
	validarProjetoPesquisa,
	prepararPayloadProjetoPesquisa,
	carregarProjetoPesquisaExistente,
	obterCotasSelecionadas,
}

export default projetoPesquisaController
