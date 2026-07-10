import axiosInstance from "./axios";
import type { Candidato } from "../types";

export const candidatoService = {
	async findByCpf(cpf: string): Promise<Candidato | null> {
		try {
			const res = await axiosInstance.get<Candidato>(
				`/candidatos/${cpf}`,
			);
			return res.data;
		} catch (err) {
			const e = err as { response?: { status: number } };
			if (e?.response?.status === 404) return null;
			throw err;
		}
	},

	async upsert(dto: Partial<Candidato>): Promise<Candidato> {
		const res = await axiosInstance.post<Candidato>(
			"/candidatos/upsert",
			dto,
		);
		return res.data;
	},
};
