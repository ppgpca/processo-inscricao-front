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
 * Retorna a data de início da etapa de INSCRICAO do edital, ou null.
 */
export function obterDataInicioInscricao(
	edital: Edital | null,
): string | null {
	return (
		edital?.etapas?.find((e) => e.tipo === "INSCRICAO")?.dataInicio ?? null
	);
}

/**
 * Retorna a data de fim da etapa de INSCRICAO do edital, ou null.
 */
export function obterDataFimInscricao(edital: Edital | null): string | null {
	return (
		edital?.etapas?.find((e) => e.tipo === "INSCRICAO")?.dataFim ?? null
	);
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
	const inicio = formatarData(obterDataInicioInscricao(edital));
	const fim = formatarData(obterDataFimInscricao(edital));
	return `Inscrições de ${inicio} até ${fim}`;
}

/**
 * Verifica se o edital ainda está dentro do período de inscrições,
 * usando as datas da etapa INSCRICAO.
 */
export function isEditalVigente(edital: Edital | null): boolean {
	if (!edital) return false;
	const inicioStr = obterDataInicioInscricao(edital);
	const fimStr = obterDataFimInscricao(edital);
	if (!inicioStr || !fimStr) return false;
	const agora = new Date();
	return agora >= new Date(inicioStr) && agora <= new Date(fimStr);
}

const editalController = {
	formatarData,
	obterDataFimInscricao,
	obterDataInicioInscricao,
	obterTextoEdital,
	obterPeriodoInscricoes,
	isEditalVigente,
};

export default editalController;
