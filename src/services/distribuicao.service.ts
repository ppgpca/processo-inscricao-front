import axiosInstance from "../auth/axios";
import type {
	AtribuicaoItem,
	CandidatoDistribuicao,
	DocenteDistribuicao,
	ResultadoAtribuicao,
	SiglaEtapaDistribuicao,
} from "../types";

export const distribuicaoService = {
	async findCandidatos(
		idEdital: number,
		etapaSigla: SiglaEtapaDistribuicao,
	): Promise<CandidatoDistribuicao[]> {
		return (await axiosInstance.get(
			`/distribuicao/${idEdital}/${etapaSigla}/candidatos`,
		)) as CandidatoDistribuicao[];
	},

	async findDocentes(
		idEdital: number,
		etapaSigla: SiglaEtapaDistribuicao,
	): Promise<DocenteDistribuicao[]> {
		return (await axiosInstance.get(
			`/distribuicao/${idEdital}/${etapaSigla}/docentes`,
		)) as DocenteDistribuicao[];
	},

	async atribuir(
		idEdital: number,
		etapaSigla: SiglaEtapaDistribuicao,
		itens: AtribuicaoItem[],
	): Promise<ResultadoAtribuicao> {
		return (await axiosInstance.put(
			`/distribuicao/${idEdital}/${etapaSigla}/atribuicoes`,
			{ itens },
		)) as ResultadoAtribuicao;
	},

	/** Propõe distribuição automática sem gravar — o cliente sincroniza via `atribuir`. */
	async proporDistribuicaoAnteprojeto(
		idEdital: number,
	): Promise<AtribuicaoItem[]> {
		return (await axiosInstance.post(
			`/distribuicao/${idEdital}/anteprojeto/auto`,
		)) as AtribuicaoItem[];
	},
};
