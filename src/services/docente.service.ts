import axiosInstance from "../auth/axios";
import type { CandidatoAvaliacao, CriterioAvaliacao, Edital } from "../types";

export const docenteService = {
	async findEditaisComoAvaliador(): Promise<Edital[]> {
		return (await axiosInstance.get("/docentes/me/editais")) as Edital[];
	},

	async findCriteriosByEdital(idEdital: number): Promise<CriterioAvaliacao[]> {
		return (await axiosInstance.get("/docentes/me/criterios", {
			params: { idEdital },
		})) as CriterioAvaliacao[];
	},

	async salvarNotas(
		notas: { idInscricao: number; idCriterioAvaliacao: number; nota: number }[],
	): Promise<void> {
		await axiosInstance.put("/docentes/me/notas", { notas });
	},

	async findSubCriteriosByPai(
		idCriterioPai: number,
	): Promise<CriterioAvaliacao[]> {
		return (await axiosInstance.get("/docentes/me/subcriterios", {
			params: { idCriterioPai },
		})) as CriterioAvaliacao[];
	},

	async findCandidatosParaAvaliar(
		idCriterio: number,
	): Promise<CandidatoAvaliacao[]> {
		return (await axiosInstance.get("/docentes/me/candidatos", {
			params: { idCriterio },
		})) as CandidatoAvaliacao[];
	},
};
