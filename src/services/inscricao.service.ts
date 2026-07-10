import axiosInstance from './axios'
import type { Inscricao } from '../types'

export const inscricaoService = {
	async findByCpfEdital(cpf: string, idEdital: number): Promise<Inscricao | null> {
		const res = await axiosInstance.get<Inscricao>('/inscricoes/buscar', {
			params: { cpf, idEdital },
		})
		return res.data
	},

	async create(dto: Partial<Inscricao>): Promise<Inscricao> {
		const res = await axiosInstance.post<Inscricao>('/inscricoes', dto)
		return res.data
	},

	async update(id: number, dto: Record<string, unknown>): Promise<Inscricao> {
		const res = await axiosInstance.put<Inscricao>(`/inscricoes/${id}`, dto)
		return res.data
	},

	async findMaisRecentePorCpf(cpf: string): Promise<Inscricao | null> {
		try {
			const res = await axiosInstance.get<Inscricao>('/inscricoes/mais-recente', {
				params: { cpf },
			})
			return res.data
		} catch (err) {
			const e = err as { response?: { status: number } }
			if (e?.response?.status === 404) return null
			throw err
		}
	},

	async desativar(id: number): Promise<void> {
		await axiosInstance.put(`/inscricoes/${id}/desativar`)
	},
}
