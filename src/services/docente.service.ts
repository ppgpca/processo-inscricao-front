import axiosInstance, { axiosDownload } from "../auth/axios";
import { extrairNomeArquivoDownload } from "../controllers/documentos-controller";
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
		codigoDocente?: string,
	): Promise<void> {
		await axiosInstance.put("/docentes/me/notas", {
			notas,
			...(codigoDocente ? { codigoDocente } : {}),
		});
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

	async findNotasPorInscricaoECriterio(
		idInscricao: number,
		idCriterio: number,
		codigoDocente?: string,
	): Promise<{ idCriterioAvaliacao: number; nota: number | null }[]> {
		return (await axiosInstance.get("/docentes/me/notas", {
			params: {
				idInscricao,
				idCriterio,
				...(codigoDocente ? { codigoDocente } : {}),
			},
		})) as { idCriterioAvaliacao: number; nota: number | null }[];
	},

	async baixarAnteprojeto(
		idInscricao: number,
		fallbackNome: string,
	): Promise<{ blob: Blob; nomeArquivo: string }> {
		// axiosDownload: mesmos interceptors de request (token + refresh + redirect)
		// mas retorna AxiosResponse completo para que possamos ler os headers.
		const response = await axiosDownload.get<Blob>(
			`/docentes/me/candidatos/${idInscricao}/anteprojeto/download`,
			{ responseType: "blob" },
		);
		const disposition =
			(response.headers["content-disposition"] as string | undefined) ?? "";
		const nomeArquivo = extrairNomeArquivoDownload(disposition, fallbackNome);
		return { blob: response.data, nomeArquivo };
	},
};
