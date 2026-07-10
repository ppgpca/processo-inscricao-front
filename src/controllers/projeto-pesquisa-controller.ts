import type { Inscricao, ProjetoPesquisa } from "../types";

/**
 * Retorna o estado inicial do projeto de pesquisa
 */
export function getInitialProjetoPesquisa(): ProjetoPesquisa {
	return {
		idLinhaPesquisa: "",
		projetoPesquisa: "",
		deficiente: false,
		indigena: false,
		pretoPardo: false,
		idsPalavrasChave: [],
	};
}

/**
 * Verifica se os campos obrigatórios do projeto de pesquisa estão preenchidos
 */
export function isProjetoPesquisaValido(dados: ProjetoPesquisa): boolean {
	return !!(
		dados.idLinhaPesquisa &&
		dados.projetoPesquisa &&
		dados.idsPalavrasChave.length >= 1 &&
		dados.idsPalavrasChave.length <= 5
	);
}

/**
 * Valida os dados do projeto de pesquisa retornando detalhes
 */
export function validarProjetoPesquisa(dados: ProjetoPesquisa): {
	isValid: boolean;
	message?: string;
} {
	const errors: string[] = [];

	if (!dados.idLinhaPesquisa) errors.push("Linha de pesquisa é obrigatória");
	if (!dados.projetoPesquisa) errors.push("Título do projeto é obrigatório");
	if (dados.idsPalavrasChave.length === 0)
		errors.push("Selecione ao menos uma palavra-chave");
	if (dados.idsPalavrasChave.length > 5)
		errors.push("Selecione no máximo 5 palavras-chave");

	if (errors.length > 0) {
		return { isValid: false, message: errors.join(". ") };
	}

	return { isValid: true };
}

/**
 * Prepara o payload do projeto de pesquisa para envio à API
 * Remove campos opcionais vazios
 */
export function prepararPayloadProjetoPesquisa(
	dados: ProjetoPesquisa,
): Partial<ProjetoPesquisa> {
	return {
		idLinhaPesquisa: dados.idLinhaPesquisa
			? Number(dados.idLinhaPesquisa)
			: undefined,
		projetoPesquisa: dados.projetoPesquisa || undefined,
		deficiente: dados.deficiente,
		indigena: dados.indigena,
		pretoPardo: dados.pretoPardo,
		idsPalavrasChave: dados.idsPalavrasChave,
	};
}

/**
 * Carrega dados do projeto de pesquisa a partir de uma inscrição existente
 */
export function carregarProjetoPesquisaExistente(
	insc: Inscricao | null,
): ProjetoPesquisa {
	if (!insc) return getInitialProjetoPesquisa();
	return {
		idLinhaPesquisa: insc.idLinhaPesquisa ?? "",
		projetoPesquisa: insc.projetoPesquisa ?? "",
		deficiente: insc.deficiente ?? false,
		indigena: insc.indigena ?? false,
		pretoPardo: insc.pretoPardo ?? false,
		idsPalavrasChave:
			insc.inscricoesPalavraChave?.map((ipk) => ipk.idPalavraChave) ?? [],
	};
}

/**
 * Obtém as cotas selecionadas como array de labels
 */
export function obterCotasSelecionadas(dados: ProjetoPesquisa): string[] {
	const cotas: string[] = [];
	if (dados.deficiente) cotas.push("Pessoa com deficiência (PcD)");
	if (dados.indigena) cotas.push("Pessoa indígena");
	if (dados.pretoPardo) cotas.push("Pessoa preta ou parda");
	return cotas;
}

const projetoPesquisaController = {
	getInitialProjetoPesquisa,
	isProjetoPesquisaValido,
	validarProjetoPesquisa,
	prepararPayloadProjetoPesquisa,
	carregarProjetoPesquisaExistente,
	obterCotasSelecionadas,
};

export default projetoPesquisaController;
