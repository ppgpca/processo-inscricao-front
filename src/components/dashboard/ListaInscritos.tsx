import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import type { InscritoDashboard } from "../../types";
import CustomDataGrid from "../customs/CustomDataGrid";

interface Props {
	dados: InscritoDashboard[];
}

function mascaraCpf(cpf: string): string {
	if (!cpf) return "";
	const limpo = cpf.replace(/\D/g, "");
	if (limpo.length !== 11) return cpf;
	return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 8)}*-**`;
}

const colunas: GridColDef[] = [
	{
		field: "cpf",
		headerName: "CPF",
		width: 160,
		renderCell: (params) => (
			<span
				style={{
					fontFamily: "monospace",
					fontSize: 13,
					whiteSpace: "nowrap",
				}}
			>
				{mascaraCpf(params.value as string)}
			</span>
		),
	},
	{
		field: "siglaLinhaPesquisa",
		headerName: "Linha de pesquisa",
		width: 160,
		renderCell: (params) =>
			params.value || (
				<Typography
					variant="body2"
					color="text.disabled"
					sx={{ fontStyle: "italic" }}
				>
					Não informada
				</Typography>
			),
	},
	{
		field: "anteprojeto",
		headerName: "Título do anteprojeto",
		flex: 2,
		minWidth: 200,
		renderCell: (params) =>
			params.value || (
				<Typography
					variant="body2"
					color="text.disabled"
					sx={{ fontStyle: "italic" }}
				>
					Não informado
				</Typography>
			),
	},
	{
		field: "palavrasChave",
		headerName: "Palavras-chave",
		flex: 2,
		minWidth: 200,
		sortable: false,
		renderCell: (params) => {
			const palavras: string[] = params.value ?? [];
			if (palavras.length === 0) {
				return (
					<Typography
						variant="body2"
						color="text.disabled"
						sx={{ fontStyle: "italic" }}
					>
						Nenhuma
					</Typography>
				);
			}
			return (
				<Box
					sx={{
						display: "flex",
						flexWrap: "wrap",
						gap: 0.5,
						py: 0.5,
					}}
				>
					{palavras.map((palavra) => (
						<Chip key={palavra} label={palavra} size="small" />
					))}
				</Box>
			);
		},
	},
];

const dataGridBgSx = (bgColor: string) => ({
	backgroundColor: bgColor,
	"& .MuiDataGrid-columnHeaders": { backgroundColor: bgColor },
	"& .MuiDataGrid-columnHeader": { backgroundColor: bgColor },
	"& .MuiDataGrid-columnHeadersInner": { backgroundColor: bgColor },
	"& .MuiDataGrid-scrollbarFiller": { backgroundColor: bgColor },
	"& .MuiDataGrid-footerContainer": { backgroundColor: bgColor },
	"& .MuiDataGrid-row": { backgroundColor: bgColor },
	"& .MuiDataGrid-filler": { backgroundColor: bgColor },
});

export default function ListaInscritos({ dados }: Props) {
	const theme = useTheme();

	const rows = dados.map((inscrito, index) => ({ id: index, ...inscrito }));

	return (
		<Card
			sx={{
				backgroundColor: theme.palette.background.default,
				display: "flex",
				flexDirection: "column",
			}}
		>
			<CardContent
				sx={{
					display: "flex",
					flexDirection: "column",
					height: "100%",
					"&:last-child": { paddingBottom: "8px" },
				}}
			>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						mb: 1,
					}}
				>
					<Typography variant="subtitle1">
						Lista de inscritos
					</Typography>
					<Chip
						label={`${dados.length} inscri${dados.length !== 1 ? "ções" : "ção"}`}
						size="small"
						color="primary"
						variant="outlined"
					/>
				</Box>

				{dados.length === 0 ? (
					<Typography
						variant="body2"
						color="text.secondary"
						sx={{ mt: 1 }}
					>
						Nenhum inscrito encontrado
					</Typography>
				) : (
					<Box sx={{ flex: 1, minHeight: 300 }}>
						<CustomDataGrid
							rows={rows}
							columns={colunas}
							pageSize={10}
							getRowId={(row) => row.id}
							getRowHeight={() => "auto"}
							sx={{
								...dataGridBgSx(
									theme.palette.background.default,
								),
								"& .MuiDataGrid-cell": {
									alignItems: "flex-start",
									py: 1,
								},
							}}
						/>
					</Box>
				)}
			</CardContent>
		</Card>
	);
}
