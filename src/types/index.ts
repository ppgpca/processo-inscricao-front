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
	dataInicioInscricao: string;
	dataFimInscricao: string;
	urlEditalPdf?: string;
	tiposDocumento?: TipoDocumentoEdital[];
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

export interface InscritoDashboard {
	cpf: string;
	linhaPesquisa: string;
	anteprojeto: string;
}

export interface DadosDashboard {
	inscricoesPorDia: InscricaoPorDia[];
	inscritosPorLinhaPesquisa: InscritoPorLinhaPesquisa[];
	inscritos: InscritoDashboard[];
}

export type ThemeMode = "light" | "dark";

export interface AppMessage {
	text: string;
	severity: "success" | "error" | "info" | "warning";
}
