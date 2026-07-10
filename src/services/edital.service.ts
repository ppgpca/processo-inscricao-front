import axiosInstance from "./axios";
import type { Edital } from "../types";

export const editalService = {
	async findVigente(): Promise<Edital> {
		const res = await axiosInstance.get<Edital>("/editais/vigente");
		return res.data;
	},

	async findProximo(): Promise<Edital | null> {
		const res = await axiosInstance.get<Edital>("/editais/proximo");
		return res.data;
	},

	async findWithDocumentos(id: number): Promise<Edital> {
		const res = await axiosInstance.get<Edital>(
			`/editais/${id}/documentos`,
		);
		return res.data;
	},
};
