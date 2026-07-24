import axiosPublico from "./axios";
import axiosAutenticado from "../auth/axios";
import type { EtapaEdital, NomeEtapaOption } from "../types";

export interface CreateEtapaEditalDto {
	nome: string;
	descricao: string;
	ordem: number;
	dataInicio?: string | null;
	dataFim?: string | null;
}

export interface UpdateEtapaEditalDto {
	nome?: string;
	descricao?: string;
	ordem?: number;
	dataInicio?: string | null;
	dataFim?: string | null;
}

export const etapaEditalService = {
	async findByEdital(idEdital: number): Promise<EtapaEdital[]> {
		const res = await axiosPublico.get<EtapaEdital[]>(
			`/editais/${idEdital}/etapas`,
		);
		return res.data;
	},

	async findNomes(): Promise<NomeEtapaOption[]> {
		const res = await axiosPublico.get<NomeEtapaOption[]>(
			"/etapas/nomes",
		);
		return res.data;
	},

	async criar(
		idEdital: number,
		dto: CreateEtapaEditalDto,
	): Promise<EtapaEdital> {
		return axiosAutenticado.post<EtapaEdital>(
			`/editais/${idEdital}/etapas`,
			dto,
		) as unknown as EtapaEdital;
	},

	async atualizar(
		idEdital: number,
		id: number,
		dto: UpdateEtapaEditalDto,
	): Promise<EtapaEdital> {
		return axiosAutenticado.put<EtapaEdital>(
			`/editais/${idEdital}/etapas/${id}`,
			dto,
		) as unknown as EtapaEdital;
	},

	async remover(idEdital: number, id: number): Promise<void> {
		await axiosAutenticado.delete(`/editais/${idEdital}/etapas/${id}`);
	},
};
