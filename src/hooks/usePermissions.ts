import { useContext } from "react";
import { AuthContext } from "../contexts/AuthContext";
import permissoesService from "../services/permissoesService";
import type { Grupo, Permissao } from "../types";

type GrupoRequerido = number | string | Partial<Grupo>;

export const usePermissions = () => {
	const authContext = useContext(AuthContext);

	const hasPermission = (
		grupos: GrupoRequerido | GrupoRequerido[],
	): boolean => {
		if (!authContext || !authContext.gruposUsuario) {
			return false;
		}
		return permissoesService.verificarPermissaoPorGrupos(
			authContext.gruposUsuario,
			grupos,
		);
	};

	return {
		hasPermission,
		userPermissions: authContext?.permissoesUsuario ?? ([] as Permissao[]),
		gruposUsuario: authContext?.gruposUsuario ?? ([] as Grupo[]),
		isLoading: authContext?.loading ?? false,
	};
};
