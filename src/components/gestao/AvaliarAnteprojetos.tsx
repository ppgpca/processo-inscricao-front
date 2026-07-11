import { useCallback, useMemo, useRef, useState } from "react";
import {
	Alert,
	Box,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Tooltip,
	Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useTheme } from "@mui/material/styles";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import type { CandidatoAvaliacao, CriterioAvaliacao } from "../../types";
import CustomDataGrid from "../customs/CustomDataGrid";
import { useAvaliarAnteprojetos } from "../../hooks/useAvaliarAnteprojetos";
import AvaliacaoCriterio from "./AvaliacaoCriterio";

function mascaraCpf(cpf: string): string {
	if (!cpf) return "";
	const limpo = cpf.replace(/\D/g, "");
	if (limpo.length !== 11) return cpf;
	return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 8)}*-**`;
}

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

function BarraBusca() {
	return (
		<Box sx={{ p: 1 }}>
			<GridToolbarQuickFilter
				fullWidth
				variant="outlined"
				size="small"
				placeholder="Buscar candidato..."
			/>
		</Box>
	);
}

interface AvaliacaoAtiva {
	candidato: CandidatoAvaliacao;
	criterio: CriterioAvaliacao;
}

export default function AvaliarAnteprojetos() {
	const theme = useTheme();
	const {
		editais,
		editalSelecionado,
		setEditalSelecionado,
		criterios,
		criterioSelecionado,
		setCriterioSelecionado,
		candidatos,
		loadingEditais,
		loadingCriterios,
		loadingCandidatos,
		erro,
	} = useAvaliarAnteprojetos();

	const [avaliacaoAtiva, setAvaliacaoAtiva] = useState<AvaliacaoAtiva | null>(
		null,
	);

	const criterioAtual = criterios.find(
		(cr) => cr.id === Number(criterioSelecionado),
	);

	// Ref sempre atualizado para evitar stale closure nas colunas memoizadas
	const criterioAtualRef = useRef<CriterioAvaliacao | undefined>(undefined);
	criterioAtualRef.current = criterioAtual;

	const handleRowClick = useCallback((candidato: CandidatoAvaliacao) => {
		const criterio = criterioAtualRef.current;
		if (!criterio) return;
		setAvaliacaoAtiva({ candidato, criterio });
	}, []);

	const colunas = useMemo<GridColDef[]>(
		() => [
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
				field: "anteprojeto",
				headerName: "Título do anteprojeto",
				flex: 2,
				minWidth: 200,
				renderCell: (params) =>
					params.value ? (
						params.value
					) : (
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
			{
				field: "acoes",
				headerName: "",
				width: 56,
				sortable: false,
				filterable: false,
				align: "center",
				headerAlign: "center",
				renderCell: (params) => (
					<Tooltip title="Avaliar">
						<IconButton
							size="small"
							color="inherit"
							onClick={(e) => {
								e.stopPropagation();
								handleRowClick(params.row as CandidatoAvaliacao);
							}}
						>
							<EditIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				),
			},
		],
		[],
	);

	const rows = candidatos.map((c: CandidatoAvaliacao) => ({
		id: c.idInscricao,
		...c,
	}));

	// Quando há avaliação ativa, exibe o componente de avaliação de critério
	if (avaliacaoAtiva) {
		return (
			<AvaliacaoCriterio
				criterio={avaliacaoAtiva.criterio}
				candidato={avaliacaoAtiva.candidato}
				onVoltar={() => setAvaliacaoAtiva(null)}
			/>
		);
	}

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 3 }}>
				Avaliar Anteprojetos
			</Typography>

			<Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
				<FormControl sx={{ flex: 1, minWidth: 220, maxWidth: 400 }}>
					<InputLabel id="select-edital-label">
						Selecionar edital
					</InputLabel>
					<Select
						labelId="select-edital-label"
						value={editalSelecionado}
						label="Selecionar edital"
						onChange={(e) =>
							setEditalSelecionado(e.target.value as number | "")
						}
						disabled={loadingEditais}
					>
						<MenuItem value="">
							<em>— Selecione um edital —</em>
						</MenuItem>
						{editais.map((edital) => (
							<MenuItem key={edital.id} value={edital.id}>
								{edital.numero}/{edital.ano}
								{edital.titulo ? ` — ${edital.titulo}` : ""}
							</MenuItem>
						))}
					</Select>
				</FormControl>

				<FormControl sx={{ flex: 1, minWidth: 220, maxWidth: 400 }}>
					<InputLabel id="select-criterio-label">
						Critério de avaliação
					</InputLabel>
					<Select
						labelId="select-criterio-label"
						value={criterioSelecionado}
						label="Critério de avaliação"
						onChange={(e) =>
							setCriterioSelecionado(e.target.value as number | "")
						}
						disabled={!editalSelecionado || loadingCriterios}
					>
						<MenuItem value="">
							<em>— Selecione um critério —</em>
						</MenuItem>
						{criterios.map((criterio) => (
							<MenuItem key={criterio.id} value={criterio.id}>
								{criterio.nome}
							</MenuItem>
						))}
					</Select>
				</FormControl>
			</Box>

			{erro && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{erro}
				</Alert>
			)}

			{loadingCandidatos ? (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
					<CircularProgress />
				</Box>
			) : criterioSelecionado ? (
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
								gap: 1,
								mb: 1,
								flexWrap: "wrap",
							}}
						>
							<Typography variant="subtitle1">
								Candidatos atribuídos
							</Typography>
							<Chip
								label={`${candidatos.length} candidato${candidatos.length !== 1 ? "s" : ""}`}
								size="small"
								color="primary"
								variant="outlined"
							/>
							{criterioAtual && (
								<Chip
									label={`Nota máx: ${criterioAtual.notaMaxima} · Peso: ${criterioAtual.peso}`}
									size="small"
									variant="outlined"
									color="secondary"
								/>
							)}
						</Box>

						{criterioAtual?.descricao && (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ mb: 1.5 }}
							>
								{criterioAtual.descricao}
							</Typography>
						)}

						{candidatos.length === 0 ? (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ mt: 1 }}
							>
								Nenhum candidato atribuído a você para este critério.
							</Typography>
						) : (
							<>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ mb: 1 }}
								>
									Clique em um candidato para iniciar a avaliação.
								</Typography>
								<Box sx={{ flex: 1, minHeight: 400 }}>
									<CustomDataGrid
										rows={rows}
										columns={colunas}
										pageSize={10}
										getRowId={(row) => row.id}
										getRowHeight={() => "auto"}
										slots={{ toolbar: BarraBusca }}
										onRowClick={(params) =>
											handleRowClick(
												params.row as CandidatoAvaliacao,
											)
										}
										sx={{
											...dataGridBgSx(
												theme.palette.background.default,
											),
											"& .MuiDataGrid-row": {
												cursor: "pointer",
											},
											"& .MuiDataGrid-row:hover": {
												backgroundColor:
													theme.palette.action.hover,
											},
											"& .MuiDataGrid-cell": {
												alignItems: "flex-start",
												py: 1,
											},
										}}
									/>
								</Box>
							</>
						)}
					</CardContent>
				</Card>
			) : null}
		</Box>
	);
}
