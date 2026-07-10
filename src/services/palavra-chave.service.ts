import axiosInstance from "./axios";
import type { PalavraChave } from "../types";

export const palavraChaveService = {
	async findAll(): Promise<PalavraChave[]> {
		const res = await axiosInstance.get<PalavraChave[]>("/palavras-chave");
		return res.data;
	},
};
