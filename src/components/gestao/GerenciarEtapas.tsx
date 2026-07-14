import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import {
	Alert,
	Box,
	Button,
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
	Paper,
	Select,
	Snackbar,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { AppMessage, EtapaEdital, TipoEtapaOption } from "../../types";
import {
	etapaEditalService,
	type CreateEtapaEditalDto,
} from "../../services/etapa-edital.service";
import { editalService } from "../../services/edital.service";
import type { Edital } from "../../types";
import { formatarData } from "../../controllers/edital-controller";

interface FormState {
	tipo: string;
	nome: string;
	ordem: string;
	dataInicio: string;
	dataFim: string;
}

const FORM_VAZIO: FormState = {
	tipo: "",
	nome: "",
	ordem: "1",
	dataInicio: "",
	dataFim: "",
};

function toInputDate(iso: string | null | undefined): string {
	if (!iso) return "";
	return iso.slice(0, 10);
}

function toIsoFromInput(val: string): string | null {
	if (!val) return null;
	return new Date(val + "T00:00:00").toISOString();
}

export default function GerenciarEtapas() {
	const [editais, setEditais] = useState<Edital[]>([]);
	const [editalSelecionado, setEditalSelecionado] = useState<number | "">("");
	const [etapas, setEtapas] = useState<EtapaEdital[]>([]);
	const [tipos, setTipos] = useState<TipoEtapaOption[]>([]);
	const [loadingEditais, setLoadingEditais] = useState(true);
	const [loading, setLoading] = useState(false);
	const [salvando, setSalvando] = useState(false);
	const [message, setMessage] = useState<AppMessage | null>(null);

	const [dialogAberto, setDialogAberto] = useState(false);
	const [etapaEditando, setEtapaEditando] = useState<EtapaEdital | null>(null);
	const [form, setForm] = useState<FormState>(FORM_VAZIO);
	const [confirmarRemocao, setConfirmarRemocao] = useState<EtapaEdital | null>(
		null,
	);

	useEffect(() => {
		const carregar = async () => {
			try {
				const [listaEditais, listaTipos] = await Promise.all([
					editalService.findAll(),
					etapaEditalService.findTipos(),
				]);
				setEditais(listaEditais);
				setTipos(listaTipos);
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
				setMessage({ text: "Erro ao carregar etapas.", severity: "error" });
			} finally {
				setLoading(false);
			}
		};
		carregar();
	}, [editalSelecionado]);

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
			tipo: etapa.tipo,
			nome: etapa.nome,
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
		if (!editalSelecionado || !form.tipo || !form.nome || !form.ordem) return;
		setSalvando(true);
		try {
			const dto: CreateEtapaEditalDto = {
				tipo: form.tipo,
				nome: form.nome,
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
						.map((e) => (e.id === etapaEditando.id ? atualizada : e))
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
			await etapaEditalService.remover(Number(editalSelecionado), etapa.id);
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

	function obterStatusEtapa(etapa: EtapaEdital): "concluida" | "ativa" | "futura" {
		if (etapa.dataFim && new Date(etapa.dataFim) < agora) return "concluida";
		if (etapa.dataInicio && new Date(etapa.dataInicio) <= agora) return "ativa";
		return "futura";
	}

	const labelTipo = (tipo: string) =>
		tipos.find((t) => t.tipo === tipo)?.label ?? tipo;

	const formValido = form.tipo && form.nome.trim() && Number(form.ordem) >= 1;

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
					onChange={(e) => setEditalSelecionado(e.target.value as number | "")}
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

			{editalSelecionado ? (
				<>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 2,
						}}
					>
						<Typography variant="subtitle1">
							{etapas.length === 0 && !loading
								? "Nenhuma etapa configurada"
								: `${etapas.length} etapa${etapas.length !== 1 ? "s" : ""} configurada${etapas.length !== 1 ? "s" : ""}`}
						</Typography>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							onClick={abrirCriar}
							size="small"
						>
							Nova etapa
						</Button>
					</Box>

					{loading ? (
						<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
							<CircularProgress />
						</Box>
					) : etapas.length > 0 ? (
						<TableContainer component={Paper} variant="outlined">
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell sx={{ width: 56 }}>Ordem</TableCell>
										<TableCell>Tipo</TableCell>
										<TableCell>Nome</TableCell>
										<TableCell>Início</TableCell>
										<TableCell>Fim</TableCell>
										<TableCell sx={{ width: 80 }}>Status</TableCell>
										<TableCell sx={{ width: 96 }} align="center">
											Ações
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{etapas.map((etapa) => {
										const status = obterStatusEtapa(etapa);
										return (
											<TableRow key={etapa.id} hover>
												<TableCell>{etapa.ordem}</TableCell>
												<TableCell>
													<Typography
														variant="caption"
														sx={{
															fontFamily: "monospace",
															color: "text.secondary",
														}}
													>
														{labelTipo(etapa.tipo)}
													</Typography>
												</TableCell>
												<TableCell>
													<Typography variant="body2" fontWeight={600}>
														{etapa.nome}
													</Typography>
												</TableCell>
												<TableCell>
													{etapa.dataInicio
														? formatarData(etapa.dataInicio)
														: <Typography variant="caption" color="text.disabled">—</Typography>
													}
												</TableCell>
												<TableCell>
													{etapa.dataFim
														? formatarData(etapa.dataFim)
														: <Typography variant="caption" color="text.disabled">—</Typography>
													}
												</TableCell>
												<TableCell>
													<Chip
														label={
															status === "ativa"
																? "Em andamento"
																: status === "concluida"
																	? "Concluída"
																	: "Aguardando"
														}
														size="small"
														color={
															status === "ativa"
																? "primary"
																: status === "concluida"
																	? "success"
																	: "default"
														}
														variant={
															status === "futura" ? "outlined" : "filled"
														}
													/>
												</TableCell>
												<TableCell align="center">
													<Stack direction="row" spacing={0.5} justifyContent="center">
														<Tooltip title="Editar">
															<IconButton
																size="small"
																onClick={() => abrirEditar(etapa)}
															>
																<EditIcon fontSize="small" />
															</IconButton>
														</Tooltip>
														<Tooltip title="Remover">
															<IconButton
																size="small"
																color="error"
																onClick={() => setConfirmarRemocao(etapa)}
															>
																<DeleteIcon fontSize="small" />
															</IconButton>
														</Tooltip>
													</Stack>
												</TableCell>
											</TableRow>
										);
									})}
								</TableBody>
							</Table>
						</TableContainer>
					) : null}
				</>
			) : null}

			{/* Dialog criar / editar */}
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
								value={form.tipo}
								label="Tipo"
								onChange={(e) =>
									setForm((prev) => {
										const tipoSelecionado = tipos.find(
											(t) => t.tipo === e.target.value,
										);
										return {
											...prev,
											tipo: e.target.value,
											nome:
												prev.nome === "" && tipoSelecionado
													? tipoSelecionado.label
													: prev.nome,
										};
									})
								}
							>
								{tipos.map((t) => (
									<MenuItem key={t.tipo} value={t.tipo}>
										{t.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<TextField
							label="Nome de exibição"
							size="small"
							fullWidth
							value={form.nome}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, nome: e.target.value }))
							}
							helperText="Pode personalizar o nome exibido aos candidatos"
						/>

						<TextField
							label="Ordem"
							size="small"
							type="number"
							inputProps={{ min: 1 }}
							value={form.ordem}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, ordem: e.target.value }))
							}
							sx={{ width: 120 }}
						/>

						<Stack direction="row" spacing={2}>
							<TextField
								label="Data de início"
								type="date"
								size="small"
								InputLabelProps={{ shrink: true }}
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
								InputLabelProps={{ shrink: true }}
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
					<Button onClick={fecharDialog} color="inherit" disabled={salvando}>
						Cancelar
					</Button>
					<Button
						onClick={salvar}
						variant="contained"
						disabled={!formValido || salvando}
						startIcon={salvando ? <CircularProgress size={16} /> : undefined}
					>
						{etapaEditando ? "Salvar" : "Criar"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Dialog confirmar remoção */}
			<Dialog
				open={Boolean(confirmarRemocao)}
				onClose={() => setConfirmarRemocao(null)}
			>
				<DialogTitle>Remover etapa</DialogTitle>
				<DialogContent>
					<Typography>
						Deseja remover a etapa{" "}
						<strong>{confirmarRemocao?.nome}</strong>? Esta ação não pode
						ser desfeita.
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
						onClick={() => confirmarRemocao && remover(confirmarRemocao)}
						color="error"
						variant="contained"
						disabled={salvando}
						startIcon={salvando ? <CircularProgress size={16} /> : undefined}
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
				<Alert severity={message?.severity ?? "info"} onClose={() => setMessage(null)}>
					{message?.text}
				</Alert>
			</Snackbar>
		</Box>
	);
}
