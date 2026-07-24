import axiosInstance from "../auth/axios";
import type {
	AtribuicaoItem,
	CandidatoDistribuicao,
	DocenteDistribuicao,
	NomeEtapaDistribuicao,
	ResultadoAtribuicao,
} from "../types";

export const distribuicaoService = {
	async findCandidatos(
		idEdital: number,
		etapaNome: NomeEtapaDistribuicao,
	): Promise<CandidatoDistribuicao[]> {
		return (await axiosInstance.get(
			`/distribuicao/${idEdital}/${etapaNome}/candidatos`,
		)) as CandidatoDistribuicao[];
	},

	async findDocentes(
		idEdital: number,
		etapaNome: NomeEtapaDistribuicao,
	): Promise<DocenteDistribuicao[]> {
		return (await axiosInstance.get(
			`/distribuicao/${idEdital}/${etapaNome}/docentes`,
		)) as DocenteDistribuicao[];
	},

	async atribuir(
		idEdital: number,
		etapaNome: NomeEtapaDistribuicao,
		itens: AtribuicaoItem[],
	): Promise<ResultadoAtribuicao> {
		return (await axiosInstance.put(
			`/distribuicao/${idEdital}/${etapaNome}/atribuicoes`,
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
