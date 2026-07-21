export interface Permissao {
	id: number;
	nome?: string;
}

export interface Grupo {
	id: number;
	nome?: string;
}

export interface Usuario {
	id: number | string;
	nome: string;
	email?: string;
	permissoes?: Permissao[];
	grupos?: Grupo[];
	temConsultaTodos?: boolean;
}

export interface LinhaPesquisa {
	id: number;
	nome: string;
}

export interface PalavraChave {
	id: number;
	palavra: string;
}

export interface InscricaoPalavraChave {
	idInscricao: number;
	idPalavraChave: number;
	palavraChave?: PalavraChave;
}

export type SiglaEtapa =
	| "INSCRICAO"
	| "HOMOLOGACAO"
	| "ANALISE_CURRICULO"
	| "ANTEPROJETO"
	| "ENTREVISTA"
	| "RESULTADO_PARCIAL"
	| "RECURSO"
	| "RESULTADO_FINAL";

export interface SiglaEtapaOption {
	sigla: SiglaEtapa;
	label: string;
}

export interface EtapaEdital {
	id: number;
	idEdital: number;
	sigla: SiglaEtapa;
	nome: string;
	ordem: number;
	dataInicio: string | null;
	dataFim: string | null;
}

export interface TipoDocumentoEdital {
	id: number;
	nome: string;
	descricao?: string;
	obrigatorio: boolean;
	ativo: boolean;
	ordem: number;
}

export interface Edital {
	id: number;
	titulo: string;
	numero: string;
	ano: number;
	urlEditalPdf?: string;
	tiposDocumento?: TipoDocumentoEdital[];
	etapas?: EtapaEdital[];
}

export interface Documento {
	id: number;
	idTipoDocumentoEdital: number;
	nomeArquivoOriginal: string;
	tamanhoBytes: number;
	atual: boolean;
}

export interface Graduacao {
	curso: string;
	instituicao: string;
	anoConclusao: string;
}

export interface OcupacaoProfissional {
	instituicao: string;
	cargo: string;
	telefone: string;
}

export interface DadosComplementares {
	graduacao1: Graduacao;
	graduacao2: Graduacao;
	ocupacaoProfissional: OcupacaoProfissional;
}

export interface DadosPessoais {
	nome: string;
	dataNascimento: string;
	rg: string;
	telefone: string;
	celular: string;
	email: string;
	email2: string;
	enderecoRua: string;
	enderecoNum: string;
	enderecoBairro: string;
	enderecoCidade: string;
	enderecoEstado: string;
	enderecoCep: string;
}

export interface Candidato extends DadosPessoais {
	cpf: string;
}

export interface ProjetoPesquisa {
	idLinhaPesquisa: number | string;
	projetoPesquisa: string;
	deficiente: boolean;
	indigena: boolean;
	pretoPardo: boolean;
	idsPalavrasChave: number[];
}

export interface Inscricao {
	id: number;
	cpf: string;
	idEdital: number;
	idLinhaPesquisa?: number | string;
	projetoPesquisa?: string;
	deficiente?: boolean;
	indigena?: boolean;
	pretoPardo?: boolean;
	dadosComplementares?: DadosComplementares;
	etapa?: number;
	idEtapaAtual?: number | null;
	etapaAtual?: EtapaEdital | null;
	status?: string;
	dataEnvio?: string;
	inscricoesPalavraChave?: InscricaoPalavraChave[];
}

export interface InscricaoPorDia {
	data: string;
	quantidade: number;
}

export interface InscritoPorLinhaPesquisa {
	linhaPesquisa: string;
	quantidade: number;
}

export interface AvaliadorNota {
	codigoDocente: string;
	nome: string;
}

export interface AvaliacaoInscrito {
	idCriterio: number;
	nome: string;
	descricao?: string | null;
	notaMaxima: number;
	peso: number;
	nota: number | null;
	qtdAvaliadores: number;
	ordem: number;
	avaliadores: AvaliadorNota[];
}

export interface InscritoDashboard {
	idInscricao: number;
	nome: string;
	cpf: string;
	linhaPesquisa: string;
	siglaLinhaPesquisa: string;
	anteprojeto: string;
	palavrasChave: string[];
	dataInscricao: string;
	deferida: boolean | null;
	avaliacoes?: AvaliacaoInscrito[];
}

/** Estado de navegação de GerenciarCandidatos → AvaliarCandidatos. */
export interface NavegacaoEdicaoAvaliacao {
	origem: "candidatos";
	idEdital: number;
	codigoDocente: string;
	criterio: CriterioAvaliacao;
	candidato: CandidatoAvaliacao;
}

export interface DadosDashboard {
	inscricoesPorDia: InscricaoPorDia[];
	inscritosPorLinhaPesquisa: InscritoPorLinhaPesquisa[];
	inscritos: InscritoDashboard[];
}

export interface CriterioAvaliacao {
	id: number;
	idCriterioPai: number | null;
	nome: string;
	descricao?: string | null;
	notaMaxima: number;
	peso: number;
	ordem: number;
}

export interface CandidatoAvaliacao {
	idInscricao: number;
	cpf: string;
	anteprojeto: string;
	palavrasChave: string[];
	nota: number;
	comentario: string | null;
	/** Início do slot da banca (critério Entrevista), quando houver. */
	dataBanca?: string | null;
}

export type SiglaEtapaDistribuicao = Extract<
	SiglaEtapa,
	"ANTEPROJETO" | "ENTREVISTA" | "ANALISE_CURRICULO"
>;

export interface Docente {
	codigo: string;
	nome: string;
	email: string;
	ativo: boolean;
}

export interface DocenteDistribuicao {
	codigo: string;
	nome: string;
	palavrasChave: string[];
	linhasPesquisa: { id: number; nome: string }[];
	cargaAtual: number;
}

export interface DocenteAtribuido {
	codigoDocente: string;
	nome: string;
	temNotaLancada: boolean;
}

export interface CandidatoDistribuicao {
	idInscricao: number;
	cpf: string;
	nome: string;
	idLinhaPesquisa: number;
	linhaPesquisa: string;
	projetoPesquisa: string;
	palavrasChave: string[];
	docentesAtribuidos: DocenteAtribuido[];
	/** Início do slot da banca, quando houver. */
	dataBanca: string | null;
}

export interface AtribuicaoItem {
	idInscricao: number;
	codigosDocentes: string[];
	dataBanca?: string | null;
}

export interface ResultadoAtribuicao {
	sucesso: { idInscricao: number }[];
	falhas: { idInscricao: number; motivo: string }[];
}

export interface NotaCriterio {
	idInscricao: number;
	idCriterioAvaliacao: number;
	codigoDocente: string;
	nota: number | null;
	comentario: string | null;
}

export type ThemeMode = "light" | "dark";

export interface AppMessage {
	text: string;
	severity: "success" | "error" | "info" | "warning";
}
