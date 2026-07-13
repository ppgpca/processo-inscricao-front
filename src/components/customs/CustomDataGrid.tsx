import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
	DataGrid,
	type DataGridProps,
	type GridRowIdGetter,
	type GridRowClassNameParams,
	type GridRowHeightParams,
	type GridRowHeightReturnValue,
	type GridColumnVisibilityModel,
} from "@mui/x-data-grid";
import { customColors } from "../../theme/customColors";

interface CustomDataGridProps
	extends Omit<
		DataGridProps,
		| "rows"
		| "columns"
		| "getRowId"
		| "getRowClassName"
		| "getRowHeight"
		| "columnVisibilityModel"
	> {
	rows: DataGridProps["rows"];
	columns: DataGridProps["columns"];
	pageSize?: number;
	checkboxSelection?: boolean;
	disableRowSelectionOnClick?: boolean;
	rowSpanning?: boolean;
	getRowId?: GridRowIdGetter;
	getRowClassName?: (params: GridRowClassNameParams) => string;
	getRowHeight?: (params: GridRowHeightParams) => GridRowHeightReturnValue;
	rowHeight?: number;
	columnVisibilityModel?: GridColumnVisibilityModel;
	sx?: DataGridProps["sx"];
}

export default function CustomDataGrid({
	rows,
	columns,
	pageSize = 10,
	checkboxSelection = false,
	disableRowSelectionOnClick = true,
	rowSpanning = false,
	getRowId = (row) => row.id,
	getRowClassName,
	getRowHeight,
	rowHeight = 52,
	columnVisibilityModel = {},
	sx = {},
	...otherProps
}: CustomDataGridProps) {
	const theme = useTheme();
	const iconColor =
		theme.palette.mode === "light"
			? customColors.teal
			: customColors.platinum;

	const defaultSx: DataGridProps["sx"] = {
		"& .MuiDataGrid-cell": {
			display: "flex",
			alignItems: "center",
			justifyContent: "flex-start",
			padding: "8px",
		},
		"& .MuiDataGrid-columnHeader": {
			display: "flex",
			alignItems: "center",
			justifyContent: "flex-start",
		},
		"& .MuiIconButton-root": {
			color: iconColor,
		},
		"& .MuiIconButton-root .MuiSvgIcon-root": {
			color: iconColor,
		},
		"& .MuiIconButton-root:hover": {
			color:
				theme.palette.mode === "light"
					? customColors.darkGray
					: customColors.veronica,
		},
		...(sx as object),
	};

	return (
		<Box style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
			<DataGrid
				rows={rows}
				columns={columns}
				checkboxSelection={checkboxSelection}
				disableRowSelectionOnClick={disableRowSelectionOnClick}
				rowSpanning={rowSpanning}
				getRowId={getRowId}
				getRowClassName={getRowClassName}
				getRowHeight={getRowHeight}
				rowHeight={rowHeight}
				columnVisibilityModel={columnVisibilityModel}
				initialState={{
					pagination: { paginationModel: { pageSize } },
				}}
				pageSizeOptions={[5, 10, 25]}
				sx={{ ...defaultSx, flex: 1 }}
				{...otherProps}
			/>
		</Box>
	);
}
