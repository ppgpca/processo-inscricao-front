const permissoesService = {};

permissoesService.verificarPermissaoPorId = (permissoes, permissaoId) => {
	if (!permissoes || !Array.isArray(permissoes)) {
		return false;
	}

	return permissoes.some((permissao) => permissao.id === permissaoId);
};

permissoesService.verificarPermissaoPorIds = (permissoes, permissaoIds) => {
	if (!permissoes || !Array.isArray(permissoes)) {
		return false;
	}

	if (!Array.isArray(permissaoIds)) {
		permissaoIds = [permissaoIds];
	}

	return permissaoIds.some((id) => permissoes.some((permissao) => permissao.id === id));
};

permissoesService.verificarPermissaoPorGrupos = (gruposUsuario, gruposRequeridos) => {
	if (!gruposUsuario || !Array.isArray(gruposUsuario)) {
		return false;
	}

	if (!Array.isArray(gruposRequeridos)) {
		gruposRequeridos = [gruposRequeridos];
	}

	return gruposRequeridos.some((grupoRequerido) => {
		if (typeof grupoRequerido === 'number') {
			return gruposUsuario.some((grupo) => grupo.id === grupoRequerido);
		} else if (typeof grupoRequerido === 'string') {
			return gruposUsuario.some((grupo) => grupo.nome === grupoRequerido);
		} else if (typeof grupoRequerido === 'object') {
			if (grupoRequerido.id) {
				return gruposUsuario.some((grupo) => grupo.id === grupoRequerido.id);
			}
			if (grupoRequerido.nome) {
				return gruposUsuario.some((grupo) => grupo.nome === grupoRequerido.nome);
			}
		}
		return false;
	});
};

export default permissoesService;
