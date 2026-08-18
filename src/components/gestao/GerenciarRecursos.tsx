import { useEffect, useMemo, useState } from "react";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Snackbar,
	Stack,
	Tab,
	Tabs,
	Tooltip,
	Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import type {
	AppMessage,
	Edital,
	EtapaEdital,
	NomeEtapaRecurso,
	RecursoGestaoRow,
} from "../../types";
import { editalService } from "../../services/edital.service";
import { recursoService } from "../../services/recurso.service";
import CustomDataGrid from "../customs/CustomDataGrid";
import DecisaoRecurso from "./recurso/DecisaoRecurso";

const ABAS: { nome: NomeEtapaRecurso; label: string }[] = [
	{ nome: "RECURSO_INSCRICAO", label: "Inscrições" },
	{ nome: "RECURSO_ANTEPROJETO", label: "Anteprojeto" },
	{ nome: "RECURSO_ENTREVISTA", label: "Entrevista e Currículo" },
	{ nome: "RECURSO_RESULTADO_PARCIAL", label: "Resultado parcial" },
];

const ALIASES_ETAPA: Record<NomeEtapaRecurso, string[]> = {
	RECURSO_INSCRICAO: ["RECURSO_INSCRICAO", "Recurso inscrição"],
	RECURSO_ANTEPROJETO: ["RECURSO_ANTEPROJETO", "Recurso anteprojeto"],
	RECURSO_ENTREVISTA: [
		"RECURSO_ENTREVISTA",
		"Recurso entrevista/prova de títulos",
	],
	RECURSO_RESULTADO_PARCIAL: [
		"RECURSO_RESULTADO_PARCIAL",
		"Recurso resultado parcial",
		"Recurso  resultado parcial",
	],
};

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

function formatarDataHora(iso: string): string {
	return new Date(iso).toLocaleString("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	});
}

function obterEtapaRecurso(
	edital: Edital | undefined,
	nomeAba: NomeEtapaRecurso,
): EtapaEdital | undefined {
	const aliases = ALIASES_ETAPA[nomeAba];
	return edital?.etapas?.find((et) => aliases.includes(et.nome));
}

function prazoEncerrado(etapa: EtapaEdital | undefined): boolean {
	if (!etapa?.dataFim) return false;
	return new Date(etapa.dataFim) < new Date();
}

function ChipStatusRecurso({
	deferido,
}: {
	deferido: boolean | null;
}) {
	if (deferido === null) {
		return <Chip label="Pendente" size="small" variant="outlined" />;
	}
	return (
		<Chip
			label={deferido ? "Deferido" : "Indeferido"}
			size="small"
			color={deferido ? "success" : "error"}
		/>
	);
}

export default function GerenciarRecursos() {
	const theme = useTheme();
	const [editais, setEditais] = useState<Edital[]>([]);
	const [editalSelecionado, setEditalSelecionado] = useState<number | "">("");
	const [abaAtiva, setAbaAtiva] = useState<NomeEtapaRecurso>(ABAS[0].nome);
	const [recursos, setRecursos] = useState<RecursoGestaoRow[]>([]);
	const [loadingEditais, setLoadingEditais] = useState(true);
	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState<AppMessage | null>(null);

	const [recursoEditando, setRecursoEditando] =
		useState<RecursoGestaoRow | null>(null);
	const [confirmarRemocao, setConfirmarRemocao] =
		useState<RecursoGestaoRow | null>(null);
	const [removendo, setRemovendo] = useState(false);

	const editalAtual = editais.find((e) => e.id === editalSelecionado);
	const etapaAtual = obterEtapaRecurso(editalAtual, abaAtiva);
	const edicaoLiberada = prazoEncerrado(etapaAtual);

	useEffect(() => {
		const carregar = async () => {
			try {
				const lista = await editalService.findAll();
				setEditais(lista);
			} catch {
				setMessage({ text: "Erro ao carregar editais.", severity: "error" });
			} finally {
				setLoadingEditais(false);
			}
		};
		carregar();
	}, []);

	useEffect(() => {
		if (!editalSelecionado) {
			setRecursos([]);
			return;
		}
		const carregar = async () => {
			setLoading(true);
			try {
				const lista = await recursoService.listarGestao(
					Number(editalSelecionado),
					abaAtiva,
				);
				setRecursos(lista);
			} catch {
				setMessage({ text: "Erro ao carregar recursos.", severity: "error" });
			} finally {
				setLoading(false);
			}
		};
		carregar();
	}, [editalSelecionado, abaAtiva]);

	const remover = async (recurso: RecursoGestaoRow) => {
		if (!edicaoLiberada) return;
		setRemovendo(true);
		try {
			await recursoService.remover(recurso.id);
			setRecursos((prev) => prev.filter((r) => r.id !== recurso.id));
			setMessage({ text: "Recurso removido.", severity: "success" });
		} catch (e) {
			const msg = (
				e as { response?: { data?: { message?: string | string[] } } }
			)?.response?.data?.message;
			const texto = Array.isArray(msg) ? msg.join(" ") : msg;
			setMessage({
				text: texto ?? "Erro ao remover recurso.",
				severity: "error",
			});
		} finally {
			setRemovendo(false);
			setConfirmarRemocao(null);
		}
	};

	const colunas = useMemo<GridColDef[]>(
		() => [
			{
				field: "candidatoNome",
				headerName: "Candidato",
				flex: 1,
				minWidth: 180,
				renderCell: (params) => {
					const row = params.row as RecursoGestaoRow;
					return (
						<Box>
							<Typography variant="body2">{row.candidatoNome}</Typography>
							<Typography variant="caption" color="text.secondary">
								{row.candidatoCpf}
							</Typography>
						</Box>
					);
				},
			},
			{
				field: "texto",
				headerName: "Recurso",
				flex: 1.5,
				minWidth: 220,
				renderCell: (params) => (
					<Tooltip title={params.value as string}>
						<Typography
							variant="body2"
							sx={{
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{params.value as string}
						</Typography>
					</Tooltip>
				),
			},
			{
				field: "deferido",
				headerName: "Status",
				width: 130,
				sortable: false,
				filterable: false,
				renderCell: (params) => (
					<ChipStatusRecurso deferido={params.value as boolean | null} />
				),
			},
			{
				field: "createdAt",
				headerName: "Enviado em",
				width: 150,
				renderCell: (params) => formatarDataHora(params.value as string),
			},
			{
				field: "acoes",
				headerName: "Ações",
				width: 100,
				sortable: false,
				filterable: false,
				align: "center",
				headerAlign: "center",
				renderCell: (params) => {
					const row = params.row as RecursoGestaoRow;
					return (
						<Stack
							direction="row"
							spacing={0.5}
							sx={{ justifyContent: "center" }}
						>
							<Tooltip title={edicaoLiberada ? "Editar" : "Visualizar"}>
								<IconButton
									size="small"
									color="inherit"
									onClick={() => setRecursoEditando(row)}
								>
									{edicaoLiberada ? (
										<EditIcon fontSize="small" />
									) : (
										<VisibilityIcon fontSize="small" />
									)}
								</IconButton>
							</Tooltip>
							{edicaoLiberada && (
								<Tooltip title="Remover">
									<IconButton
										size="small"
										color="inherit"
										onClick={() => setConfirmarRemocao(row)}
									>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</Tooltip>
							)}
						</Stack>
					);
				},
			},
		],
		[edicaoLiberada],
	);

	if (recursoEditando) {
		return (
			<DecisaoRecurso
				recurso={recursoEditando}
				somenteLeitura={!edicaoLiberada}
				onVoltar={() => setRecursoEditando(null)}
				onSalvo={(atualizado) => {
					setRecursos((prev) =>
						prev.map((r) => (r.id === atualizado.id ? atualizado : r)),
					);
					setRecursoEditando(null);
					setMessage({
						text: "Decisão salva com sucesso.",
						severity: "success",
					});
				}}
			/>
		);
	}

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 3 }}>
				Recursos
			</Typography>

			<FormControl fullWidth sx={{ mb: 3, maxWidth: 480 }}>
				<InputLabel id="select-edital-recursos-label">
					Selecionar edital
				</InputLabel>
				<Select
					labelId="select-edital-recursos-label"
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

			{editalSelecionado && (
				<Tabs
					value={abaAtiva}
					onChange={(_, valor) => setAbaAtiva(valor)}
					sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
				>
					{ABAS.map((aba) => (
						<Tab key={aba.nome} value={aba.nome} label={aba.label} />
					))}
				</Tabs>
			)}

			{editalSelecionado && !edicaoLiberada && (
				<Alert severity="info" sx={{ mb: 2 }}>
					O prazo de envio desta etapa ainda não encerrou
					{etapaAtual?.dataFim
						? ` (até ${formatarDataHora(etapaAtual.dataFim)})`
						: ""}
					. É possível visualizar os recursos e baixar os documentos; decisão e
					remoção ficam disponíveis após o término do prazo.
				</Alert>
			)}

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
					<CircularProgress />
				</Box>
			) : editalSelecionado ? (
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
						{recursos.length === 0 ? (
							<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
								Nenhum recurso enviado para esta etapa.
							</Typography>
						) : (
							<Box sx={{ flex: 1, minHeight: 400 }}>
								<CustomDataGrid
									rows={recursos}
									columns={colunas}
									pageSize={10}
									getRowId={(row) => row.id}
									getRowHeight={() => "auto"}
									sx={{
										...dataGridBgSx(theme.palette.background.default),
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
			) : null}

			<Dialog
				open={Boolean(confirmarRemocao)}
				onClose={() => setConfirmarRemocao(null)}
			>
				<DialogTitle>Remover recurso</DialogTitle>
				<DialogContent>
					<Typography>
						Deseja remover o recurso de{" "}
						<strong>{confirmarRemocao?.candidatoNome}</strong>? Esta ação
						não pode ser desfeita.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setConfirmarRemocao(null)}
						color="inherit"
						disabled={removendo}
					>
						Cancelar
					</Button>
					<Button
						onClick={() => confirmarRemocao && remover(confirmarRemocao)}
						color="error"
						variant="contained"
						disabled={removendo}
						startIcon={
							removendo ? <CircularProgress size={16} /> : undefined
						}
					>
						Remover
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={!!message}
				autoHideDuration={4000}
				onClose={() => setMessage(null)}
			>
				<Alert
					severity={message?.severity ?? "info"}
					onClose={() => setMessage(null)}
				>
					{message?.text}
				</Alert>
			</Snackbar>
		</Box>
	);
}
