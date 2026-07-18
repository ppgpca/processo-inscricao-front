import axiosInstance from "./axios";
import type { Edital } from "../types";

export const editalService = {
	async findVigente(): Promise<Edital | null> {
		const res = await axiosInstance.get<Edital | null>("/editais/vigente");
		return res.data || null;
	},

	async findProximo(): Promise<Edital | null> {
		const res = await axiosInstance.get<Edital | null>("/editais/proximo");
		return res.data || null;
	},

	async findWithDocumentos(id: number): Promise<Edital> {
		const res = await axiosInstance.get<Edital>(
			`/editais/${id}/documentos`,
		);
		return res.data;
	},

	async findAll(): Promise<Edital[]> {
		const res = await axiosInstance.get<Edital[]>("/editais");
		return res.data;
	},
};
