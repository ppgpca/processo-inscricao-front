import axiosInstance from './axios'
import type { Documento } from '../types'

export const documentoService = {
	async findByInscricao(idInscricao: number): Promise<Documento[]> {
		const res = await axiosInstance.get<Documento[]>(`/documentos/inscricao/${idInscricao}`)
		return res.data
	},

	async upload(
		idInscricao: number,
		idTipoDocumentoEdital: number,
		arquivo: File,
	): Promise<Documento> {
		const formData = new FormData()
		formData.append('arquivo', arquivo)
		const res = await axiosInstance.post<Documento>(
			`/documentos/inscricao/${idInscricao}/tipo/${idTipoDocumentoEdital}`,
			formData,
		)
		return res.data
	},

	async remover(idInscricao: number, idTipoDocumentoEdital: number): Promise<void> {
		await axiosInstance.delete(
			`/documentos/inscricao/${idInscricao}/tipo/${idTipoDocumentoEdital}`,
		)
	},

	getDownloadUrl(idInscricao: number, idTipoDocumentoEdital: number): string {
		const base = axiosInstance.defaults.baseURL ?? ''
		return `${base}/documentos/inscricao/${idInscricao}/tipo/${idTipoDocumentoEdital}/download`
	},
}
