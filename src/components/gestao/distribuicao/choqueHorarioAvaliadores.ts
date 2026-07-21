/** Duração padrão do slot de entrevista (alinha com MontagemBancas). */
export const DURACAO_SLOT_MIN = 30;

export interface CompromissoAvaliador {
	codigoDocente: string;
	nomeDocente: string;
	idInscricao: number;
	nomeCandidato: string;
	/** Início do slot em epoch ms. */
	inicioMs: number;
}

export interface JanelaBanca {
	id: string;
	data: string;
	horaInicio: string;
	horaFim: string;
	codigosDocentes: string[];
}

function minutosDesdeMeiaNoite(hora: string): number {
	const [h, m] = hora.split(":").map(Number);
	return h * 60 + m;
}

export function fimSlotMs(
	inicioMs: number,
	duracaoMin = DURACAO_SLOT_MIN,
): number {
	return inicioMs + duracaoMin * 60 * 1000;
}

export function intervalosSobrepostos(
	inicioA: number,
	fimA: number,
	inicioB: number,
	fimB: number,
): boolean {
	return inicioA < fimB && inicioB < fimA;
}

export function formatarHorarioLocal(isoOuMs: string | number): string {
	const d = typeof isoOuMs === "number" ? new Date(isoOuMs) : new Date(isoOuMs);
	return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

/** Converte data (yyyy-mm-dd) + hora (HH:mm) em epoch ms (fuso local). */
export function inicioSlotMs(data: string, hora: string): number {
	const [ano, mes, dia] = data.split("-").map(Number);
	const [hh, mm] = hora.split(":").map(Number);
	return new Date(ano, mes - 1, dia, hh, mm, 0, 0).getTime();
}

export function janelasBancasSobrepostas(
	a: Pick<JanelaBanca, "data" | "horaInicio" | "horaFim">,
	b: Pick<JanelaBanca, "data" | "horaInicio" | "horaFim">,
): boolean {
	if (!a.data || !b.data || a.data !== b.data) return false;
	if (!a.horaInicio || !a.horaFim || !b.horaInicio || !b.horaFim) return false;
	const inicioA = minutosDesdeMeiaNoite(a.horaInicio);
	const fimA = minutosDesdeMeiaNoite(a.horaFim);
	const inicioB = minutosDesdeMeiaNoite(b.horaInicio);
	const fimB = minutosDesdeMeiaNoite(b.horaFim);
	if (
		[inicioA, fimA, inicioB, fimB].some((n) => Number.isNaN(n)) ||
		fimA <= inicioA ||
		fimB <= inicioB
	) {
		return false;
	}
	return intervalosSobrepostos(inicioA, fimA, inicioB, fimB);
}

/**
 * Verifica se algum avaliador já tem compromisso cujo intervalo de 30 min
 * cruza `[inicioMs, inicioMs + duração)`.
 * Ignora a própria inscrição (`idInscricaoIgnorar`).
 */
export function encontrarChoqueHorario(params: {
	codigosDocentes: string[];
	inicioMs: number;
	compromissos: CompromissoAvaliador[];
	idInscricaoIgnorar?: number | null;
	duracaoMin?: number;
}): CompromissoAvaliador | null {
	const choques = encontrarChoquesPorDocente(params);
	for (const choque of choques.values()) {
		return choque;
	}
	return null;
}

/**
 * Retorna o primeiro compromisso conflitante por código de docente
 * entre os avaliadores informados.
 */
export function encontrarChoquesPorDocente(params: {
	codigosDocentes: string[];
	inicioMs: number;
	compromissos: CompromissoAvaliador[];
	idInscricaoIgnorar?: number | null;
	duracaoMin?: number;
}): Map<string, CompromissoAvaliador> {
	const {
		codigosDocentes,
		inicioMs,
		compromissos,
		idInscricaoIgnorar = null,
		duracaoMin = DURACAO_SLOT_MIN,
	} = params;
	const fimMs = fimSlotMs(inicioMs, duracaoMin);
	const setCodigos = new Set(codigosDocentes);
	const porDocente = new Map<string, CompromissoAvaliador>();

	for (const c of compromissos) {
		if (!setCodigos.has(c.codigoDocente)) continue;
		if (porDocente.has(c.codigoDocente)) continue;
		if (
			idInscricaoIgnorar != null &&
			c.idInscricao === idInscricaoIgnorar
		) {
			continue;
		}
		const fimC = fimSlotMs(c.inicioMs, duracaoMin);
		if (intervalosSobrepostos(inicioMs, fimMs, c.inicioMs, fimC)) {
			porDocente.set(c.codigoDocente, c);
		}
	}
	return porDocente;
}

export function mensagemChoqueHorario(choque: CompromissoAvaliador): string {
	return (
		`Choque de horário: ${choque.nomeDocente} já está em entrevista com ` +
		`${choque.nomeCandidato} em ${formatarHorarioLocal(choque.inicioMs)}.`
	);
}

/**
 * Conflito entre janelas de bancas que compartilham avaliador
 * (mesmo dia e intervalo de funcionamento sobreposto).
 */
export function encontrarChoqueJanelaBancas(params: {
	banca: JanelaBanca;
	outras: JanelaBanca[];
	nomeDocente: (codigo: string) => string;
}): { codigoDocente: string; nomeDocente: string; bancaConflitanteId: string } | null {
	const { banca, outras, nomeDocente } = params;
	if (!banca.data || !banca.horaInicio || !banca.horaFim) return null;

	for (const outra of outras) {
		if (outra.id === banca.id) continue;
		if (!janelasBancasSobrepostas(banca, outra)) continue;
		const compartilhado = banca.codigosDocentes.find((c) =>
			outra.codigosDocentes.includes(c),
		);
		if (compartilhado) {
			return {
				codigoDocente: compartilhado,
				nomeDocente: nomeDocente(compartilhado),
				bancaConflitanteId: outra.id,
			};
		}
	}
	return null;
}

/**
 * Retorna mensagem de choque de janela por código de docente.
 */
export function encontrarChoquesJanelaBancasPorDocente(params: {
	banca: JanelaBanca;
	outras: JanelaBanca[];
	nomeDocente: (codigo: string) => string;
}): Map<string, string> {
	const { banca, outras, nomeDocente } = params;
	const porDocente = new Map<string, string>();
	if (!banca.data || !banca.horaInicio || !banca.horaFim) return porDocente;

	for (const outra of outras) {
		if (outra.id === banca.id) continue;
		if (!janelasBancasSobrepostas(banca, outra)) continue;
		for (const codigo of banca.codigosDocentes) {
			if (porDocente.has(codigo)) continue;
			if (!outra.codigosDocentes.includes(codigo)) continue;
			porDocente.set(
				codigo,
				`Choque de horário: ${nomeDocente(codigo)} já participa de outra banca ` +
					`no mesmo dia com intervalo sobreposto.`,
			);
		}
	}
	return porDocente;
}

/**
 * Slot de outro candidato que cai dentro da janela da banca
 * para algum avaliador selecionado.
 */
export function encontrarChoqueSlotNaJanela(params: {
	codigosDocentes: string[];
	data: string;
	horaInicio: string;
	horaFim: string;
	compromissos: CompromissoAvaliador[];
	idsInscricaoIgnorar?: number[];
}): CompromissoAvaliador | null {
	const choques = encontrarChoquesSlotNaJanelaPorDocente(params);
	for (const choque of choques.values()) {
		return choque;
	}
	return null;
}

/**
 * Retorna o primeiro compromisso conflitante na janela por código de docente.
 */
export function encontrarChoquesSlotNaJanelaPorDocente(params: {
	codigosDocentes: string[];
	data: string;
	horaInicio: string;
	horaFim: string;
	compromissos: CompromissoAvaliador[];
	idsInscricaoIgnorar?: number[];
}): Map<string, CompromissoAvaliador> {
	const {
		codigosDocentes,
		data,
		horaInicio,
		horaFim,
		compromissos,
		idsInscricaoIgnorar = [],
	} = params;
	const porDocente = new Map<string, CompromissoAvaliador>();
	if (!data || !horaInicio || !horaFim) return porDocente;

	const inicioJanela = inicioSlotMs(data, horaInicio);
	const fimJanela = inicioSlotMs(data, horaFim);
	if (
		Number.isNaN(inicioJanela) ||
		Number.isNaN(fimJanela) ||
		fimJanela <= inicioJanela
	) {
		return porDocente;
	}

	const ignorar = new Set(idsInscricaoIgnorar);
	const setCodigos = new Set(codigosDocentes);

	for (const c of compromissos) {
		if (!setCodigos.has(c.codigoDocente)) continue;
		if (porDocente.has(c.codigoDocente)) continue;
		if (ignorar.has(c.idInscricao)) continue;
		const fimC = fimSlotMs(c.inicioMs);
		if (intervalosSobrepostos(inicioJanela, fimJanela, c.inicioMs, fimC)) {
			porDocente.set(c.codigoDocente, c);
		}
	}
	return porDocente;
}
