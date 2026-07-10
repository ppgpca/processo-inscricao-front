import type { GridColDef } from "@mui/x-data-grid";
import { Permissoes } from "../enums/permissoes";

type HasPermissionFn = (permissions: number[]) => boolean;

interface ColumnWithHide extends GridColDef {
	hide?: boolean | ((hasPermission: HasPermissionFn) => boolean);
}

export const createColumnWithPermission = (
	columnConfig: GridColDef,
	requiredPermissions: number[],
	hasPermission: HasPermissionFn,
): ColumnWithHide => {
	return {
		...columnConfig,
		hide: !hasPermission(requiredPermissions),
	};
};

interface ActionHandlers {
	adminActions?: (row: unknown) => React.ReactNode;
	coordenadorActions?: (row: unknown) => React.ReactNode;
	docenteActions?: (row: unknown) => React.ReactNode;
}

export const createActionColumns = (
	hasPermission: HasPermissionFn,
	actions: ActionHandlers,
): GridColDef[] => {
	const columns: GridColDef[] = [];

	if (hasPermission([Permissoes.GRUPOS.ADMIN]) && actions.adminActions) {
		columns.push({
			field: "actionsAdmin",
			headerName: "Ações Admin",
			sortable: false,
			width: 300,
			renderCell: (params) => actions.adminActions!(params.row),
		});
	}

	if (hasPermission([Permissoes.GRUPOS.COORDENADOR]) && actions.coordenadorActions) {
		columns.push({
			field: "actionsCoordenador",
			headerName: "Ações Coordenador",
			sortable: false,
			width: 200,
			renderCell: (params) => actions.coordenadorActions!(params.row),
		});
	}

	if (hasPermission([Permissoes.GRUPOS.DOCENTE]) && actions.docenteActions) {
		columns.push({
			field: "actionsDocente",
			headerName: "Ações Docente",
			sortable: false,
			width: 200,
			renderCell: (params) => actions.docenteActions!(params.row),
		});
	}

	return columns;
};

export const filterColumnsByPermission = (
	columns: ColumnWithHide[],
	hasPermission: HasPermissionFn,
): GridColDef[] => {
	return columns.filter((column) => {
		if (column.hide === undefined) {
			return true;
		}

		if (typeof column.hide === "function") {
			return !column.hide(hasPermission);
		}

		return !column.hide;
	});
};
