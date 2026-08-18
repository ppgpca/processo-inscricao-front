import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
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
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import type { AppMessage, EtapaEdital, NomeEtapaOption } from "../../types";
import {
	etapaEditalService,
	type CreateEtapaEditalDto,
} from "../../services/etapa-edital.service";
import { editalService } from "../../services/edital.service";
import type { Edital } from "../../types";
import { formatarData } from "../../controllers/edital-controller";
import CustomDataGrid from "../customs/CustomDataGrid";

interface FormState {
	nome: string;
	descricao: string;
	ordem: string;
	dataInicio: string;
	dataFim: string;
}

type StatusEtapa = "concluida" | "ativa" | "futura";

interface EtapaRow extends EtapaEdital {
	nomeLabel: string;
	status: StatusEtapa;
}

const FORM_VAZIO: FormState = {
	nome: "",
	descricao: "",
	ordem: "1",
	dataInicio: "",
	dataFim: "",
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

function BarraBusca() {
	return (
		<Box sx={{ p: 1 }}>
			<GridToolbarQuickFilter
				slotProps={{
					root: {
						fullWidth: true,
						size: "small",
						placeholder: "Buscar etapa...",
					},
				}}
			/>
		</Box>
	);
}

function ChipStatusEtapa({ status }: { status: StatusEtapa }) {
	if (status === "concluida") {
		return <Chip label="Concluída" size="small" color="success" />;
	}
	if (status === "ativa") {
		return (
			<Chip
				label="Em andamento"
				size="small"
				color="success"
				variant="outlined"
			/>
		);
	}
	return (
		<Chip
			label="Aguardando"
			size="small"
			variant="outlined"
			sx={{
				backgroundColor: "transparent !important",
				borderColor: "text.secondary",
				color: "text.secondary",
			}}
		/>
	);
}

function toInputDate(iso: string | null | undefined): string {
	if (!iso) return "";
	return iso.slice(0, 10);
}

function toIsoFromInput(val: string): string | null {
	if (!val) return null;
	return new Date(val + "T00:00:00").toISOString();
}

function obterStatusEtapa(etapa: EtapaEdital, agora: Date): StatusEtapa {
	if (etapa.dataFim && new Date(etapa.dataFim) < agora) return "concluida";
	if (etapa.dataInicio && new Date(etapa.dataInicio) <= agora) return "ativa";
	return "futura";
}

export default function GerenciarEtapas() {
	const theme = useTheme();
	const [editais, setEditais] = useState<Edital[]>([]);
	const [editalSelecionado, setEditalSelecionado] = useState<number | "">("");
	const [etapas, setEtapas] = useState<EtapaEdital[]>([]);
	const [nomes, setNomes] = useState<NomeEtapaOption[]>([]);
	const [loadingEditais, setLoadingEditais] = useState(true);
	const [loading, setLoading] = useState(false);
	const [salvando, setSalvando] = useState(false);
	const [message, setMessage] = useState<AppMessage | null>(null);

	const [dialogAberto, setDialogAberto] = useState(false);
	const [etapaEditando, setEtapaEditando] = useState<EtapaEdital | null>(
		null,
	);
	const [form, setForm] = useState<FormState>(FORM_VAZIO);
	const [confirmarRemocao, setConfirmarRemocao] =
		useState<EtapaEdital | null>(null);

	useEffect(() => {
		const carregar = async () => {
			try {
				const [listaEditais, listaNomes] = await Promise.all([
					editalService.findAll(),
					etapaEditalService.findNomes(),
				]);
				setEditais(listaEditais);
				setNomes(listaNomes);
			} catch {
				setMessage({
					text: "Erro ao carregar editais.",
					severity: "error",
				});
			} finally {
				setLoadingEditais(false);
			}
		};
		carregar();
	}, []);

	useEffect(() => {
		if (!editalSelecionado) {
			setEtapas([]);
			return;
		}
		const carregar = async () => {
			setLoading(true);
			try {
				const lista = await etapaEditalService.findByEdital(
					Number(editalSelecionado),
				);
				setEtapas(lista);
			} catch {
				setMessage({
					text: "Erro ao carregar etapas.",
					severity: "error",
				});
			} finally {
				setLoading(false);
			}
		};
		carregar();
	}, [editalSelecionado]);

	const labelNome = (nome: string) =>
		nomes.find((s) => s.nome === nome)?.label ?? nome;

	const abrirCriar = () => {
		setEtapaEditando(null);
		const proximaOrdem =
			etapas.length > 0 ? Math.max(...etapas.map((e) => e.ordem)) + 1 : 1;
		setForm({ ...FORM_VAZIO, ordem: String(proximaOrdem) });
		setDialogAberto(true);
	};

	const abrirEditar = (etapa: EtapaEdital) => {
		setEtapaEditando(etapa);
		setForm({
			nome: etapa.nome,
			descricao: etapa.descricao,
			ordem: String(etapa.ordem),
			dataInicio: toInputDate(etapa.dataInicio),
			dataFim: toInputDate(etapa.dataFim),
		});
		setDialogAberto(true);
	};

	const fecharDialog = () => {
		setDialogAberto(false);
		setEtapaEditando(null);
		setForm(FORM_VAZIO);
	};

	const salvar = async () => {
		if (!editalSelecionado || !form.nome || !form.descricao || !form.ordem)
			return;
		setSalvando(true);
		try {
			const dto: CreateEtapaEditalDto = {
				nome: form.nome,
				descricao: form.descricao,
				ordem: Number(form.ordem),
				dataInicio: toIsoFromInput(form.dataInicio),
				dataFim: toIsoFromInput(form.dataFim),
			};

			if (etapaEditando) {
				const atualizada = await etapaEditalService.atualizar(
					Number(editalSelecionado),
					etapaEditando.id,
					dto,
				);
				setEtapas((prev) =>
					prev
						.map((e) =>
							e.id === etapaEditando.id ? atualizada : e,
						)
						.sort((a, b) => a.ordem - b.ordem),
				);
				setMessage({
					text: "Etapa atualizada com sucesso.",
					severity: "success",
				});
			} else {
				const nova = await etapaEditalService.criar(
					Number(editalSelecionado),
					dto,
				);
				setEtapas((prev) =>
					[...prev, nova].sort((a, b) => a.ordem - b.ordem),
				);
				setMessage({
					text: "Etapa criada com sucesso.",
					severity: "success",
				});
			}
			fecharDialog();
		} catch {
			setMessage({ text: "Erro ao salvar etapa.", severity: "error" });
		} finally {
			setSalvando(false);
		}
	};

	const remover = async (etapa: EtapaEdital) => {
		setSalvando(true);
		try {
			await etapaEditalService.remover(
				Number(editalSelecionado),
				etapa.id,
			);
			setEtapas((prev) => prev.filter((e) => e.id !== etapa.id));
			setMessage({ text: "Etapa removida.", severity: "success" });
		} catch {
			setMessage({ text: "Erro ao remover etapa.", severity: "error" });
		} finally {
			setSalvando(false);
			setConfirmarRemocao(null);
		}
	};

	const agora = new Date();

	const rows = useMemo<EtapaRow[]>(
		() =>
			etapas.map((etapa) => ({
				...etapa,
				nomeLabel: labelNome(etapa.nome),
				status: obterStatusEtapa(etapa, agora),
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[etapas, nomes],
	);

	const colunas = useMemo<GridColDef[]>(
		() => [
			{
				field: "ordem",
				headerName: "Ordem",
				width: 80,
				type: "number",
			},
			{
				field: "nomeLabel",
				headerName: "Tipo",
				width: 200,
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
				field: "descricao",
				headerName: "Descrição",
				flex: 1,
				minWidth: 180,
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
				field: "dataInicio",
				headerName: "Início",
				width: 130,
				renderCell: (params) =>
					params.value ? (
						formatarData(params.value as string)
					) : (
						<Typography
							variant="body2"
							color="text.disabled"
							sx={{ fontStyle: "italic" }}
						>
							—
						</Typography>
					),
			},
			{
				field: "dataFim",
				headerName: "Fim",
				width: 130,
				renderCell: (params) =>
					params.value ? (
						formatarData(params.value as string)
					) : (
						<Typography
							variant="body2"
							color="text.disabled"
							sx={{ fontStyle: "italic" }}
						>
							—
						</Typography>
					),
			},
			{
				field: "status",
				headerName: "Status",
				width: 140,
				sortable: false,
				filterable: false,
				renderCell: (params) => (
					<ChipStatusEtapa status={params.value as StatusEtapa} />
				),
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
					const row = params.row as EtapaRow;
					return (
						<Stack
							direction="row"
							spacing={0.5}
							sx={{ justifyContent: "center" }}
						>
							<Tooltip title="Editar">
								<IconButton
									size="small"
									color="inherit"
									onClick={() => abrirEditar(row)}
								>
									<EditIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							<Tooltip title="Remover">
								<IconButton
									size="small"
									color="inherit"
									onClick={() => setConfirmarRemocao(row)}
								>
									<DeleteIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</Stack>
					);
				},
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[],
	);

	const formValido =
		form.nome && form.descricao.trim() && Number(form.ordem) >= 1;

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 3 }}>
				Gerenciar Etapas do Processo Seletivo
			</Typography>

			<FormControl fullWidth sx={{ mb: 3, maxWidth: 480 }}>
				<InputLabel id="select-edital-etapas-label">
					Selecionar edital
				</InputLabel>
				<Select
					labelId="select-edital-etapas-label"
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
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								mb: 1,
								flexWrap: "wrap",
								gap: 1,
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
								}}
							>
								<Typography variant="subtitle1">
									Etapas do processo seletivo
								</Typography>
								<Chip
									label={`${etapas.length} etapa${etapas.length !== 1 ? "s" : ""}`}
									size="small"
									color="primary"
									variant="outlined"
								/>
							</Box>

							<Button
								variant="contained"
								startIcon={<AddIcon />}
								onClick={abrirCriar}
								size="small"
							>
								Nova etapa
							</Button>
						</Box>

						{etapas.length === 0 ? (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ mt: 1 }}
							>
								Nenhuma etapa configurada para este edital.
							</Typography>
						) : (
							<Box sx={{ flex: 1, minHeight: 400 }}>
								<CustomDataGrid
									rows={rows}
									columns={colunas}
									pageSize={10}
									getRowId={(row) => row.id}
									slots={{ toolbar: BarraBusca }}
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
			) : null}

			<Dialog
				open={dialogAberto}
				onClose={fecharDialog}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					{etapaEditando ? "Editar etapa" : "Nova etapa"}
				</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<FormControl fullWidth size="small">
							<InputLabel>Tipo</InputLabel>
							<Select
								value={form.nome}
								label="Tipo"
								onChange={(e) =>
									setForm((prev) => {
										const nomeSelecionado = nomes.find(
											(s) => s.nome === e.target.value,
										);
										return {
											...prev,
											nome: e.target.value,
											descricao:
												prev.descricao === "" &&
												nomeSelecionado
													? nomeSelecionado.label
													: prev.descricao,
										};
									})
								}
							>
								{nomes.map((s) => (
									<MenuItem key={s.nome} value={s.nome}>
										{s.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<TextField
							label="Descrição"
							size="small"
							fullWidth
							value={form.descricao}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									descricao: e.target.value,
								}))
							}
							helperText="Pode personalizar a descrição exibida aos candidatos"
						/>

						<TextField
							label="Ordem"
							size="small"
							type="number"
							slotProps={{ htmlInput: { min: 1 } }}
							value={form.ordem}
							onChange={(e) =>
								setForm((prev) => ({
									...prev,
									ordem: e.target.value,
								}))
							}
							sx={{ width: 120 }}
						/>

						<Stack direction="row" spacing={2}>
							<TextField
								label="Data de início"
								type="date"
								size="small"
								slotProps={{ inputLabel: { shrink: true } }}
								value={form.dataInicio}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										dataInicio: e.target.value,
									}))
								}
								fullWidth
							/>
							<TextField
								label="Data de fim"
								type="date"
								size="small"
								slotProps={{ inputLabel: { shrink: true } }}
								value={form.dataFim}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										dataFim: e.target.value,
									}))
								}
								fullWidth
							/>
						</Stack>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={fecharDialog}
						color="inherit"
						disabled={salvando}
					>
						Cancelar
					</Button>
					<Button
						onClick={salvar}
						variant="contained"
						disabled={!formValido || salvando}
						startIcon={
							salvando ? (
								<CircularProgress size={16} />
							) : undefined
						}
					>
						{etapaEditando ? "Salvar" : "Criar"}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={Boolean(confirmarRemocao)}
				onClose={() => setConfirmarRemocao(null)}
			>
				<DialogTitle>Remover etapa</DialogTitle>
				<DialogContent>
					<Typography>
						Deseja remover a etapa{" "}
						<strong>{confirmarRemocao?.descricao}</strong>? Esta ação não
						pode ser desfeita.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setConfirmarRemocao(null)}
						color="inherit"
						disabled={salvando}
					>
						Cancelar
					</Button>
					<Button
						onClick={() =>
							confirmarRemocao && remover(confirmarRemocao)
						}
						color="error"
						variant="contained"
						disabled={salvando}
						startIcon={
							salvando ? (
								<CircularProgress size={16} />
							) : undefined
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
