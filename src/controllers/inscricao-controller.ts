import type {
	DadosComplementares,
	DadosPessoais,
	Edital,
	Inscricao,
	ProjetoPesquisa,
} from "../types";

const ORDEM_ETAPA_INSCRICAO = 1;
const ORDEM_ETAPA_HOMOLOGACAO = 2;

export function obterIdEtapaPorOrdem(
	edital: Edital | null,
	ordem: number,
): number | undefined {
	return edital?.etapas?.find((e) => e.ordem === ordem)?.id;
}
import { isDadosPessoaisValidos } from "./dados-pessoais-controller";
import { isDadosFormacaoValidos } from "./formacao-controller";
import { isProjetoPesquisaValido } from "./projeto-pesquisa-controller";

export const STEPS = [
	"Identificação",
	"Linha de Pesquisa",
	"Dados Pessoais",
	"Formação",
	"Documentos",
];

/**
 * Mapeamento de etapa da inscrição (backend) para step da UI (frontend)
 * Etapa 1 → step 1 (Linha de Pesquisa)
 * Etapa 2 ou 3 → step 3 (Formação)
 * Etapa 4 → step 4 (Documentos)
 */
const ETAPA_PARA_STEP: Record<number, number> = { 1: 1, 2: 3, 3: 4, 4: 4 };

/**
 * Retorna o step da UI correspondente à etapa da inscrição para continuar de onde parou
 */
export function obterStepParaContinuar(etapa: number | undefined): number {
	return ETAPA_PARA_STEP[etapa ?? 1] ?? 1;
}

interface ValidarEtapaParams {
	projetoPesquisa: ProjetoPesquisa;
	dadosPessoais: DadosPessoais;
	dadosComplementares: DadosComplementares;
	emailConfirmValido: boolean;
	todosObrigatoriosEnviados: boolean;
}

/**
 * Verifica se a etapa atual do stepper está válida para avançar
 */
export function validarEtapaAtual(
	activeStep: number,
	params: ValidarEtapaParams,
): boolean {
	const {
		projetoPesquisa,
		dadosPessoais,
		dadosComplementares,
		emailConfirmValido,
		todosObrigatoriosEnviados,
	} = params;
	switch (activeStep) {
		case 1:
			return isProjetoPesquisaValido(projetoPesquisa);
		case 2:
			return isDadosPessoaisValidos(dadosPessoais, emailConfirmValido);
		case 3:
			return isDadosFormacaoValidos(dadosComplementares);
		case 4:
			return todosObrigatoriosEnviados;
		default:
			return true;
	}
}

/**
 * Obtém o texto do botão de avançar
 */
export function obterTextoBotaoProximo(
	saving: boolean,
	activeStep: number,
): string {
	if (saving) return "Salvando...";
	if (activeStep === STEPS.length - 1) return "Finalizar Inscrição";
	return "Próximo";
}

interface PayloadEtapa2Result {
	update: boolean;
	id?: number;
	dados: Record<string, unknown>;
}

/**
 * Prepara o payload para criar ou atualizar uma inscrição na etapa 2 (dados pessoais)
 */
export function prepararPayloadEtapa2(
	cpf: string,
	edital: Edital,
	projetoPesquisa: ProjetoPesquisa,
	inscricaoExistente: Inscricao | null,
): PayloadEtapa2Result {
	const idEtapaInscricao = obterIdEtapaPorOrdem(edital, ORDEM_ETAPA_INSCRICAO);
	const dadosLinha = {
		idLinhaPesquisa: projetoPesquisa.idLinhaPesquisa
			? Number(projetoPesquisa.idLinhaPesquisa)
			: undefined,
		projetoPesquisa: projetoPesquisa.projetoPesquisa || undefined,
		deficiente: projetoPesquisa.deficiente,
		indigena: projetoPesquisa.indigena,
		pretoPardo: projetoPesquisa.pretoPardo,
		idsPalavrasChave: projetoPesquisa.idsPalavrasChave,
		...(idEtapaInscricao !== undefined && { idEtapaAtual: idEtapaInscricao }),
	};

	if (inscricaoExistente) {
		return {
			update: true,
			id: inscricaoExistente.id,
			dados: { etapa: 2, ...dadosLinha },
		};
	}

	return {
		update: false,
		dados: { cpf, idEdital: edital.id, etapa: 2, ...dadosLinha },
	};
}

/**
 * Prepara o payload para atualizar uma inscrição na etapa 3 (formação)
 */
export function prepararPayloadEtapa3(
	edital: Edital,
	dadosComplementares: DadosComplementares,
): Record<string, unknown> {
	const idEtapaInscricao = obterIdEtapaPorOrdem(edital, ORDEM_ETAPA_INSCRICAO);
	return {
		etapa: 3,
		dadosComplementares,
		...(idEtapaInscricao !== undefined && { idEtapaAtual: idEtapaInscricao }),
	};
}

/**
 * Prepara o payload para finalizar a inscrição (etapa 5)
 */
export function prepararPayloadFinalizacao(
	edital: Edital,
): Record<string, unknown> {
	const idEtapaHomologacao = obterIdEtapaPorOrdem(
		edital,
		ORDEM_ETAPA_HOMOLOGACAO,
	);
	return {
		etapa: 5,
		dataEnvio: new Date().toISOString(),
		...(idEtapaHomologacao !== undefined && {
			idEtapaAtual: idEtapaHomologacao,
		}),
	};
}

/**
 * Determina a fonte dos dados complementares ao iniciar nova inscrição
 * Prioriza: inscricaoAnterior > inscricaoHistorico
 */
export function obterFonteDadosComplementares(
	inscricaoAnterior: Inscricao | null,
	inscricaoHistorico: Inscricao | null,
): DadosComplementares | null {
	return (
		inscricaoAnterior?.dadosComplementares ??
		inscricaoHistorico?.dadosComplementares ??
		null
	);
}

const inscricaoController = {
	STEPS,
	obterStepParaContinuar,
	validarEtapaAtual,
	obterTextoBotaoProximo,
	obterIdEtapaPorOrdem,
	prepararPayloadEtapa2,
	prepararPayloadEtapa3,
	prepararPayloadFinalizacao,
	obterFonteDadosComplementares,
};

export default inscricaoController;
