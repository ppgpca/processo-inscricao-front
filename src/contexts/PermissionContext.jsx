import React from 'react';
import { Alert, Box } from '@mui/material';
import { useAuth } from './AuthContext';
import permissoesService from '../services/permissoesService';

export default function PermissionContext({
	children,
	permissoes,
	grupos,
	fallback = null,
	showError = true,
}) {
	const { permissoesUsuario, gruposUsuario } = useAuth();

	let hasPermission = false;

	if (grupos && grupos.length > 0) {
		hasPermission = permissoesService.verificarPermissaoPorGrupos(gruposUsuario, grupos);
	} else if (permissoes && permissoes.length > 0) {
		hasPermission = permissoesService.verificarPermissaoPorIds(permissoesUsuario, permissoes);
	}

	if (!hasPermission) {
		if (fallback) {
			return fallback;
		}

		if (showError) {
			return (
				<Box sx={{ p: 2 }}>
					<Alert severity="warning">
						Você não tem permissão para acessar este recurso.
					</Alert>
				</Box>
			);
		}

		return null;
	}

	return children;
}
