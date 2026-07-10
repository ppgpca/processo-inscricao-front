import axiosInstance from "../auth/axios";
import type { DadosDashboard } from "../types";

export const dashboardService = {
	async obterDados(idEdital?: number): Promise<DadosDashboard> {
		const params = idEdital ? { idEdital } : {};
		return (await axiosInstance.get("/inscricoes/dashboard", {
			params,
		})) as DadosDashboard;
	},
};
