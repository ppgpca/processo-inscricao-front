import type { Inscricao } from "../types";

/**
 * Aplica máscara de CPF: 000.000.000-00
 */
export function formatarCpf(valor: string): string {
	const digits = valor.replace(/\D/g, "").slice(0, 11);
	return digits
		.replace(/(\d{3})(\d)/, "$1.$2")
		.replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
		.replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

/**
 * Remove formatação do CPF, retornando apenas dígitos
 */
export function limparCpf(cpf: string): string {
	return cpf.replace(/\D/g, "");
}

/**
 * Extrai os 5 dígitos de identificação para uso em nomes de arquivo.
 * CPF (11 dígitos): posições 3–7 → ".XXX.XX." (espelho de identificacaoCandidato no backend).
 * Passaporte: descarta 1º char, remove letras, remove zero inicial, toma 5 dígitos → "XXX.XX".
 */
export function identificacaoParaDownload(cpf: string): string {
	const digitos = cpf.replace(/\D/g, "");
	if (digitos.length === 11) {
		const cinco = digitos.slice(3, 8);
		if (!/^\d{5}$/.test(cinco)) return cpf;
		return `.${cinco.slice(0, 3)}.${cinco.slice(3)}.`;
	}
	// Passaporte
	let resto = cpf.slice(1).replace(/\D/g, "");
	if (resto.startsWith("0")) resto = resto.slice(1);
	if (resto.length < 5) return cpf;
	const cinco = resto.slice(0, 5);
	return `${cinco.slice(0, 3)}.${cinco.slice(3)}`;
}

/**
 * Exibição do passaporte no formato do edital publicado.
 * Descarta o primeiro caractere, as letras restantes e um único zero
 * à esquerda. Os cinco primeiros dígitos saem como XXX.XX.
 */
function mascaraPassaporte(valor: string): string {
	let resto = valor.slice(1).replace(/\D/g, "");
	if (resto.startsWith("0")) resto = resto.slice(1);
	if (resto.length < 5) return valor;
	const cinco = resto.slice(0, 5);
	return `${cinco.slice(0, 3)}.${cinco.slice(3)}`;
}

/**
 * Máscara de visualização do documento.
 * CPF com 11 dígitos: ***.456.78*-**
 * Demais valores (passaporte): formato do edital publicado.
 */
export function mascaraCpf(valor: string): string {
	if (!valor) return "";
	const digitos = limparCpf(valor);
	if (digitos.length === 11) {
		return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 8)}*-**`;
	}
	return mascaraPassaporte(valor);
}

/**
 * Valida se o CPF possui exatamente 11 dígitos
 */
export function validarCpfDigitos(cpf: string): {
	valido: boolean;
	erro: string | null;
} {
	const digits = limparCpf(cpf);
	if (digits.length !== 11) {
		return { valido: false, erro: "Informe um CPF válido com 11 dígitos." };
	}
	return { valido: true, erro: null };
}

function calcularDigitoVerificadorCpf(digits: string, tamanho: number): number {
	let soma = 0;
	for (let i = 0; i < tamanho; i++) {
		soma += Number(digits[i]) * (tamanho + 1 - i);
	}
	const resto = (soma * 10) % 11;
	return resto === 10 ? 0 : resto;
}

/**
 * Valida o CPF completo: 11 dígitos e dígitos verificadores.
 */
export function validarCpf(cpf: string): {
	valido: boolean;
	erro: string | null;
} {
	const quantidade = validarCpfDigitos(cpf);
	if (!quantidade.valido) return quantidade;

	const digits = limparCpf(cpf);
	if (/^(\d)\1{10}$/.test(digits)) {
		return {
			valido: false,
			erro: "CPF inválido. Verifique o número informado.",
		};
	}

	const digito1 = calcularDigitoVerificadorCpf(digits, 9);
	const digito2 = calcularDigitoVerificadorCpf(digits, 10);
	if (digito1 !== Number(digits[9]) || digito2 !== Number(digits[10])) {
		return {
			valido: false,
			erro: "CPF inválido. Verifique o número informado.",
		};
	}

	return { valido: true, erro: null };
}

/**
 * Verifica se a inscrição está finalizada (enviada ou etapa >= 5)
 */
export function isInscricaoFinalizada(insc: Inscricao | null): boolean {
	if (!insc) return false;
	return (
		insc.status === "enviada" || !!insc.dataEnvio || (insc.etapa ?? 0) >= 5
	);
}

/**
 * Obtém o label descritivo de uma etapa pelo número
 */
export function obterLabelEtapa(etapa: number): string {
	const labels: Record<number, string> = {
		1: "Linha de Pesquisa",
		2: "Dados Pessoais",
		3: "Formação",
		4: "Documentos",
	};
	return labels[etapa] ?? `Etapa ${etapa}`;
}

/**
 * Valida se a confirmação do número de inscrição está correta
 */
export function validarConfirmacaoNumeroInscricao(
	confirmacao: string,
	inscricaoId: number | null | undefined,
): boolean {
	if (!inscricaoId) return false;
	return confirmacao.trim() === String(inscricaoId);
}

/**
 * Obtém o texto de status de uma inscrição existente para exibição
 */
export function obterTextoStatusInscricao(
	insc: Inscricao | null,
): string | null {
	if (!insc) return null;
	if (isInscricaoFinalizada(insc)) return "enviada";
	return "em andamento";
}

const cpfController = {
	formatarCpf,
	limparCpf,
	mascaraCpf,
	validarCpfDigitos,
	validarCpf,
	isInscricaoFinalizada,
	obterLabelEtapa,
	validarConfirmacaoNumeroInscricao,
	obterTextoStatusInscricao,
};

export default cpfController;
