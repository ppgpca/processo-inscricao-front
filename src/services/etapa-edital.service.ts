import axiosPublico from "./axios";
import axiosAutenticado from "../auth/axios";
import type { EtapaEdital, SiglaEtapaOption } from "../types";

export interface CreateEtapaEditalDto {
	sigla: string;
	nome: string;
	ordem: number;
	dataInicio?: string | null;
	dataFim?: string | null;
}

export interface UpdateEtapaEditalDto {
	sigla?: string;
	nome?: string;
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

	async findSiglas(): Promise<SiglaEtapaOption[]> {
		const res = await axiosPublico.get<SiglaEtapaOption[]>(
			"/etapas/siglas",
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
