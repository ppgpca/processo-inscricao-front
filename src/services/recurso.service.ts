import axiosPublico from "./axios";
import axiosAutenticado from "../auth/axios";
import type {
	DocumentoRecurso,
	EtapaRecursoConsulta,
	Recurso,
	RecursoGestaoRow,
} from "../types";
import { documentoService } from "./documento.service";

export interface CreateRecursoDto {
	cpf: string;
	idInscricao: number;
	idEtapaEdital: number;
	texto: string;
}

export interface UploadDocumentoRecursoDto {
	cpf: string;
	idInscricao: number;
	idEtapaEdital: number;
	idTipoDocumentoEdital: number;
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

	async uploadDocumento(
		dto: UploadDocumentoRecursoDto,
		arquivo: File,
	): Promise<DocumentoRecurso> {
		const formData = new FormData();
		formData.append("arquivo", arquivo);
		formData.append("cpf", dto.cpf);
		formData.append("idInscricao", String(dto.idInscricao));
		formData.append("idEtapaEdital", String(dto.idEtapaEdital));
		formData.append(
			"idTipoDocumentoEdital",
			String(dto.idTipoDocumentoEdital),
		);
		const res = await axiosPublico.post<DocumentoRecurso>(
			"/recursos/documento",
			formData,
		);
		return res.data;
	},

	getDownloadUrl(idInscricao: number, idTipoDocumentoEdital: number): string {
		return documentoService.getDownloadUrl(
			idInscricao,
			idTipoDocumentoEdital,
		);
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
