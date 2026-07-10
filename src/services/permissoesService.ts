import type { Grupo, Permissao } from "../types";

type GrupoRequerido = number | string | Partial<Grupo>;

const permissoesService = {
	verificarPermissaoPorId(
		permissoes: Permissao[],
		permissaoId: number,
	): boolean {
		if (!permissoes || !Array.isArray(permissoes)) {
			return false;
		}
		return permissoes.some((permissao) => permissao.id === permissaoId);
	},

	verificarPermissaoPorIds(
		permissoes: Permissao[],
		permissaoIds: number | number[],
	): boolean {
		if (!permissoes || !Array.isArray(permissoes)) {
			return false;
		}
		const ids = Array.isArray(permissaoIds) ? permissaoIds : [permissaoIds];
		return ids.some((id) =>
			permissoes.some((permissao) => permissao.id === id),
		);
	},

	verificarPermissaoPorGrupos(
		gruposUsuario: Grupo[],
		gruposRequeridos: GrupoRequerido | GrupoRequerido[],
	): boolean {
		if (!gruposUsuario || !Array.isArray(gruposUsuario)) {
			return false;
		}
		const requeridos = Array.isArray(gruposRequeridos)
			? gruposRequeridos
			: [gruposRequeridos];

		return requeridos.some((grupoRequerido) => {
			if (typeof grupoRequerido === "number") {
				return gruposUsuario.some(
					(grupo) => grupo.id === grupoRequerido,
				);
			} else if (typeof grupoRequerido === "string") {
				return gruposUsuario.some(
					(grupo) => grupo.nome === grupoRequerido,
				);
			} else if (typeof grupoRequerido === "object") {
				if (grupoRequerido.id) {
					return gruposUsuario.some(
						(grupo) => grupo.id === grupoRequerido.id,
					);
				}
				if (grupoRequerido.nome) {
					return gruposUsuario.some(
						(grupo) => grupo.nome === grupoRequerido.nome,
					);
				}
			}
			return false;
		});
	},
};

export default permissoesService;
