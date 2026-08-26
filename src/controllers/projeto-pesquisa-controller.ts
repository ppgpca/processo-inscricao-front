import type {
	Inscricao,
	ModalidadeConcorrencia,
	ProjetoPesquisa,
} from "../types";

/**
 * Retorna o estado inicial do projeto de pesquisa
 */
export function getInitialProjetoPesquisa(): ProjetoPesquisa {
	return {
		idLinhaPesquisa: "",
		projetoPesquisa: "",
		modalidadeConcorrencia: "",
		deficiente: false,
		indigena: false,
		pretoPardo: false,
		idsPalavrasChave: [],
	};
}

function temCotaSelecionada(dados: ProjetoPesquisa): boolean {
	return dados.deficiente || dados.indigena || dados.pretoPardo;
}

/**
 * Infere a modalidade a partir das cotas já salvas na inscrição
 */
export function inferirModalidadeConcorrencia(
	insc: Pick<Inscricao, "deficiente" | "indigena" | "pretoPardo">,
): ModalidadeConcorrencia {
	if (insc.deficiente || insc.indigena || insc.pretoPardo) return "cota";
	return "ampla";
}

/**
 * Zera as cotas quando a modalidade não é reserva de vagas
 */
export function obterCotasParaPayload(dados: ProjetoPesquisa): {
	deficiente: boolean;
	indigena: boolean;
	pretoPardo: boolean;
} {
	if (dados.modalidadeConcorrencia !== "cota") {
		return { deficiente: false, indigena: false, pretoPardo: false };
	}
	return {
		deficiente: dados.deficiente,
		indigena: dados.indigena,
		pretoPardo: dados.pretoPardo,
	};
}

/**
 * Verifica se os campos obrigatórios do projeto de pesquisa estão preenchidos
 */
export function isProjetoPesquisaValido(dados: ProjetoPesquisa): boolean {
	const modalidadeOk =
		dados.modalidadeConcorrencia === "ampla" ||
		(dados.modalidadeConcorrencia === "cota" && temCotaSelecionada(dados));

	return !!(
		dados.idLinhaPesquisa &&
		dados.projetoPesquisa &&
		dados.idsPalavrasChave.length >= 1 &&
		dados.idsPalavrasChave.length <= 5 &&
		modalidadeOk
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
	if (!dados.modalidadeConcorrencia) {
		errors.push("Selecione a modalidade de concorrência");
	} else if (
		dados.modalidadeConcorrencia === "cota" &&
		!temCotaSelecionada(dados)
	) {
		errors.push("Selecione ao menos uma cota para concorrer");
	}

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
		...obterCotasParaPayload(dados),
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
		modalidadeConcorrencia: inferirModalidadeConcorrencia(insc),
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
	if (dados.modalidadeConcorrencia !== "cota") return [];
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
	inferirModalidadeConcorrencia,
	obterCotasParaPayload,
};

export default projetoPesquisaController;
