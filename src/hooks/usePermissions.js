import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import permissoesService from '../services/permissoesService';

export const usePermissions = () => {
	const authContext = useContext(AuthContext);

	const hasPermission = (grupos) => {
		if (!authContext || !authContext.gruposUsuario) {
			return false;
		}

		return permissoesService.verificarPermissaoPorGrupos(authContext.gruposUsuario, grupos);
	};

	return {
		hasPermission,
		userPermissions: authContext?.permissoesUsuario || [],
		gruposUsuario: authContext?.gruposUsuario || [],
		isLoading: authContext?.loading || false,
	};
};
