import axiosInstance from "./axios";
import type { LinhaPesquisa } from "../types";

export const linhaPesquisaService = {
	async findAll(): Promise<LinhaPesquisa[]> {
		const res =
			await axiosInstance.get<LinhaPesquisa[]>("/linhas-pesquisa");
		return res.data;
	},
};
