import type { Edital } from "../types";

const LOCALE = "pt-BR";

/**
 * Formata uma data para exibição no formato dd/mm/aaaa
 */
export function formatarData(data: string | null | undefined): string | null {
	if (!data) return null;
	return new Date(data).toLocaleDateString(LOCALE, {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

/**
 * Formata a data de fim de inscrições do edital
 */
export function formatarDataFimInscricao(
	data: string | null | undefined,
): string | null {
	return formatarData(data);
}

/**
 * Formata a data de início de inscrições do edital
 */
export function formatarDataInicioInscricao(
	data: string | null | undefined,
): string | null {
	return formatarData(data);
}

/**
 * Monta o texto de identificação do edital para exibição (ex.: "Edital nº 01/2026")
 */
export function obterTextoEdital(edital: Edital | null): string {
	if (!edital) return "";
	return `Edital nº ${edital.numero} (${edital.ano})`;
}

/**
 * Monta o texto completo do período de inscrições
 */
export function obterPeriodoInscricoes(edital: Edital | null): string {
	if (!edital) return "";
	const inicio = formatarData(edital.dataInicioInscricao);
	const fim = formatarData(edital.dataFimInscricao);
	return `Inscrições de ${inicio} até ${fim}`;
}

/**
 * Verifica se o edital ainda está dentro do período de inscrições
 */
export function isEditalVigente(edital: Edital | null): boolean {
	if (!edital) return false;
	const agora = new Date();
	const inicio = new Date(edital.dataInicioInscricao);
	const fim = new Date(edital.dataFimInscricao);
	return agora >= inicio && agora <= fim;
}

const editalController = {
	formatarData,
	formatarDataFimInscricao,
	formatarDataInicioInscricao,
	obterTextoEdital,
	obterPeriodoInscricoes,
	isEditalVigente,
};

export default editalController;
