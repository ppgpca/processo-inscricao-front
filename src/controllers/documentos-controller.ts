import type { Documento, TipoDocumentoEdital } from "../types";

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
	"application/pdf",
	"image/jpeg",
	"image/png",
	"image/webp",
];

export const ALLOWED_EXTENSIONS_LABEL = "PDF, JPG, PNG ou WEBP";

/**
 * Valida o arquivo selecionado para upload
 * Retorna string de erro ou null se válido
 */
export function validarArquivo(file: File): string | null {
	if (file.size > MAX_FILE_SIZE) {
		return "O arquivo excede o tamanho máximo de 10 MB.";
	}
	if (!ALLOWED_MIME_TYPES.includes(file.type)) {
		return `Tipo de arquivo não permitido: ${file.type}. Envie ${ALLOWED_EXTENSIONS_LABEL}.`;
	}
	return null;
}

/**
 * Encontra o documento atual (mais recente) de um tipo na lista
 */
export function obterDocumentoAtual(
	documentos: Documento[],
	idTipo: number,
): Documento | null {
	return (
		documentos.find((d) => d.idTipoDocumentoEdital === idTipo && d.atual) ??
		null
	);
}

/**
 * Verifica se todos os documentos obrigatórios e ativos foram enviados
 */
export function todosObrigatoriosEnviados(
	tiposDocumento: TipoDocumentoEdital[],
	documentos: Documento[],
): boolean {
	return tiposDocumento
		.filter((t) => t.obrigatorio && t.ativo)
		.every((t) => !!obterDocumentoAtual(documentos, t.id));
}

/**
 * Filtra e ordena os tipos de documento ativos pelo campo ordem
 */
export function ordenarTiposDocumentoAtivos(
	tipos: TipoDocumentoEdital[],
): TipoDocumentoEdital[] {
	return tipos.filter((t) => t.ativo).sort((a, b) => a.ordem - b.ordem);
}

/**
 * Extrai o nome do arquivo a partir do header Content-Disposition
 */
export function extrairNomeArquivoDownload(
	contentDisposition: string | null,
	fallback: string,
): string {
	if (!contentDisposition) return fallback;
	const match = contentDisposition.match(
		/filename\*?=(?:UTF-8'')?["']?([^"';\r\n]+)["']?/i,
	);
	return match ? decodeURIComponent(match[1]) : fallback;
}

/**
 * Extrai a mensagem de erro de uma resposta de upload
 */
export function obterMensagemErroUpload(error: unknown): string {
	const err = error as { response?: { data?: { message?: string } } };
	return (
		err?.response?.data?.message ??
		"Erro ao enviar o arquivo. Tente novamente."
	);
}

/**
 * Formata o tamanho de um arquivo em KB
 */
export function formatarTamanhoArquivo(bytes: number): string {
	return `${(bytes / 1024).toFixed(0)} KB`;
}

const documentosController = {
	MAX_FILE_SIZE,
	ALLOWED_MIME_TYPES,
	ALLOWED_EXTENSIONS_LABEL,
	validarArquivo,
	obterDocumentoAtual,
	todosObrigatoriosEnviados,
	ordenarTiposDocumentoAtivos,
	extrairNomeArquivoDownload,
	obterMensagemErroUpload,
	formatarTamanhoArquivo,
};

export default documentosController;
