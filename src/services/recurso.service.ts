import axiosPublico from "./axios";
import axiosAutenticado from "../auth/axios";
import type { EtapaRecursoConsulta, Recurso, RecursoGestaoRow } from "../types";

export interface CreateRecursoDto {
	cpf: string;
	idInscricao: number;
	idEtapaEdital: number;
	texto: string;
}

export interface DecisaoRecursoDto {
	deferido: boolean;
	comentario: string;
}

export const recursoService = {
	async consultar(
		cpf: string,
		idInscricao: number,
	): Promise<EtapaRecursoConsulta[]> {
		const res = await axiosPublico.get<EtapaRecursoConsulta[]>(
			"/recursos/consulta",
			{ params: { cpf, idInscricao } },
		);
		return res.data;
	},

	async enviar(dto: CreateRecursoDto): Promise<Recurso> {
		const res = await axiosPublico.post<Recurso>("/recursos", dto);
		return res.data;
	},

	async listarGestao(
		idEdital: number,
		etapaNome: string,
	): Promise<RecursoGestaoRow[]> {
		return axiosAutenticado.get<RecursoGestaoRow[]>(
			`/recursos/gestao/${idEdital}/${etapaNome}`,
		) as unknown as RecursoGestaoRow[];
	},

	async decidir(id: number, dto: DecisaoRecursoDto): Promise<Recurso> {
		return axiosAutenticado.put<Recurso>(
			`/recursos/${id}/decisao`,
			dto,
		) as unknown as Recurso;
	},

	async remover(id: number): Promise<void> {
		await axiosAutenticado.delete(`/recursos/${id}`);
	},
};
