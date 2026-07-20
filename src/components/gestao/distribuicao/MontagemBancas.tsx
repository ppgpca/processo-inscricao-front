import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Badge,
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	ListItemText,
	Menu,
	MenuItem,
	OutlinedInput,
	Radio,
	Select,
	Snackbar,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import SyncIcon from "@mui/icons-material/Sync";
import type { GridColDef } from "@mui/x-data-grid";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import CustomDataGrid from "../../customs/CustomDataGrid";
import type {
	AppMessage,
	AtribuicaoItem,
	CandidatoDistribuicao,
	DocenteAtribuido,
	DocenteDistribuicao,
} from "../../../types";

type Periodo = "MANHA" | "TARDE" | "NOITE";

const LABEL_PERIODO: Record<Periodo, string> = {
	MANHA: "Manhã",
	TARDE: "Tarde",
	NOITE: "Noite",
};

interface Banca {
	id: string;
	periodo?: Periodo;
	data: string;
	codigosDocentes: string[];
}

const BANCA_VAZIA = (mostrarPeriodo: boolean): Banca => ({
	id: crypto.randomUUID(),
	periodo: mostrarPeriodo ? "MANHA" : undefined,
	data: "",
	codigosDocentes: [],
});

function chaveDocentes(codigos: string[]): string {
	return [...codigos].sort().join("|");
}

function bancasAPartirDeCandidatos(candidatos: CandidatoDistribuicao[]): Banca[] {
	const mapa = new Map<string, Banca>();
	for (const candidato of candidatos) {
		if (candidato.docentesAtribuidos.length === 0) continue;
		const codigos = candidato.docentesAtribuidos.map((d) => d.codigoDocente);
		const chave = chaveDocentes(codigos);
		if (!mapa.has(chave)) {
			mapa.set(chave, {
				id: crypto.randomUUID(),
				data: "",
				codigosDocentes: [...codigos].sort(),
			});
		}
	}
	return [...mapa.values()];
}

function encontrarBancaPorDocentes(
	docentes: DocenteAtribuido[],
	bancas: Banca[],
): Banca | undefined {
	if (docentes.length === 0) return undefined;
	const chave = chaveDocentes(docentes.map((d) => d.codigoDocente));
	return bancas.find((b) => chaveDocentes(b.codigosDocentes) === chave);
}

function labelBanca(
	banca: Banca,
	docentesDisponiveis: DocenteDistribuicao[] = [],
): string {
	const partes = [
		banca.periodo ? LABEL_PERIODO[banca.periodo] : null,
		banca.data || null,
	].filter(Boolean);

	if (partes.length > 0) {
		return `${partes.join(" — ")} (${banca.codigosDocentes.length} avaliador${banca.codigosDocentes.length !== 1 ? "es" : ""})`;
	}

	const nomes = banca.codigosDocentes.map(
		(codigo) =>
			docentesDisponiveis.find((d) => d.codigo === codigo)?.nome ?? codigo,
	);
	return nomes.length > 0 ? nomes.join(", ") : "Banca sem avaliadores";
}

function embaralhar<T>(lista: T[]): T[] {
	const copia = [...lista];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
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
				slotProps={{
					root: {
						fullWidth: true,
						size: "small",
						placeholder: "Buscar candidato...",
					},
				}}
			/>
		</Box>
	);
}

interface MontagemBancasProps {
	mostrarPeriodo: boolean;
	docentesDisponiveis: DocenteDistribuicao[];
	candidatos: CandidatoDistribuicao[];
	salvando: boolean;
	erro: string | null;
	onSalvarAtribuicoes: (
		itens: AtribuicaoItem[],
	) => Promise<{ sucesso: { idInscricao: number }[]; falhas: { idInscricao: number; motivo: string }[] } | undefined>;
}

export default function MontagemBancas({
	mostrarPeriodo,
	docentesDisponiveis,
	candidatos,
	salvando,
	erro,
	onSalvarAtribuicoes,
}: MontagemBancasProps) {
	const theme = useTheme();
	const [bancas, setBancas] = useState<Banca[]>([]);
	const [dialogAberto, setDialogAberto] = useState(false);
	const [bancaEditando, setBancaEditando] = useState<Banca | null>(null);
	const [form, setForm] = useState<Banca>(BANCA_VAZIA(mostrarPeriodo));
	const [confirmarRemocao, setConfirmarRemocao] = useState<Banca | null>(null);
	const [atribuicaoLocal, setAtribuicaoLocal] = useState<
		Record<number, string>
	>({});
	const [menuState, setMenuState] = useState<{
		anchorEl: HTMLElement | null;
		idInscricao: number | null;
	}>({ anchorEl: null, idInscricao: null });
	const [message, setMessage] = useState<AppMessage | null>(null);
	const [falhas, setFalhas] = useState<{ idInscricao: number; motivo: string }[]>(
		[],
	);

	const contadorPendentes = Object.keys(atribuicaoLocal).length;

	useEffect(() => {
		const seed = bancasAPartirDeCandidatos(candidatos);
		if (seed.length === 0) return;
		setBancas((prev) => {
			if (prev.length > 0) {
				// Incorpora combinações novas sem descartar bancas locais
				const existentes = new Set(
					prev.map((b) => chaveDocentes(b.codigosDocentes)),
				);
				const novas = seed.filter(
					(b) => !existentes.has(chaveDocentes(b.codigosDocentes)),
				);
				return novas.length > 0 ? [...prev, ...novas] : prev;
			}
			return seed;
		});
	}, [candidatos]);

	const abrirCriar = () => {
		setBancaEditando(null);
		setForm(BANCA_VAZIA(mostrarPeriodo));
		setDialogAberto(true);
	};

	const abrirEditar = (banca: Banca) => {
		setBancaEditando(banca);
		setForm(banca);
		setDialogAberto(true);
	};

	const fecharDialog = () => {
		setDialogAberto(false);
		setBancaEditando(null);
		setForm(BANCA_VAZIA(mostrarPeriodo));
	};

	const salvarBanca = () => {
		if (bancaEditando) {
			setBancas((prev) =>
				prev.map((b) => (b.id === bancaEditando.id ? form : b)),
			);
		} else {
			setBancas((prev) => [...prev, form]);
		}
		fecharDialog();
	};

	const removerBanca = (banca: Banca) => {
		setBancas((prev) => prev.filter((b) => b.id !== banca.id));
		setAtribuicaoLocal((prev) => {
			const next = { ...prev };
			for (const [idInscricao, bancaId] of Object.entries(next)) {
				if (bancaId === banca.id) delete next[Number(idInscricao)];
			}
			return next;
		});
		setConfirmarRemocao(null);
	};

	const abrirMenuBanca = (
		event: React.MouseEvent<HTMLElement>,
		idInscricao: number,
	) => {
		setMenuState({ anchorEl: event.currentTarget, idInscricao });
	};

	const fecharMenuBanca = () =>
		setMenuState({ anchorEl: null, idInscricao: null });

	const selecionarBanca = (bancaId: string) => {
		if (menuState.idInscricao === null) return;
		const idInscricao = menuState.idInscricao;
		const candidato = candidatos.find((c) => c.idInscricao === idInscricao);
		const banca = bancas.find((b) => b.id === bancaId);
		if (!candidato || !banca) return;

		const mesmaAtribuicao =
			chaveDocentes(candidato.docentesAtribuidos.map((d) => d.codigoDocente)) ===
			chaveDocentes(banca.codigosDocentes);

		setAtribuicaoLocal((prev) => {
			const next = { ...prev };
			if (mesmaAtribuicao) {
				delete next[idInscricao];
			} else {
				next[idInscricao] = bancaId;
			}
			return next;
		});
		fecharMenuBanca();
	};

	const distribuirAutomaticamente = () => {
		if (bancas.length === 0) return;
		const semBanca = embaralhar(
			candidatos.filter(
				(c) =>
					!(c.idInscricao in atribuicaoLocal) &&
					c.docentesAtribuidos.length === 0,
			),
		);
		if (semBanca.length === 0) {
			setMessage({
				text: "Todos os candidatos já possuem banca atribuída.",
				severity: "info",
			});
			return;
		}
		const novaAtribuicao: Record<number, string> = { ...atribuicaoLocal };
		semBanca.forEach((candidato, index) => {
			novaAtribuicao[candidato.idInscricao] =
				bancas[index % bancas.length].id;
		});
		setAtribuicaoLocal(novaAtribuicao);
	};

	const salvarAtribuicoes = async () => {
		const itens: AtribuicaoItem[] = Object.entries(atribuicaoLocal).map(
			([idInscricao, bancaId]) => {
				const banca = bancas.find((b) => b.id === bancaId);
				return {
					idInscricao: Number(idInscricao),
					codigosDocentes: banca?.codigosDocentes ?? [],
				};
			},
		);
		const resultado = await onSalvarAtribuicoes(itens);
		if (!resultado) return;
		setFalhas(resultado.falhas);
		if (resultado.falhas.length === 0) {
			setAtribuicaoLocal({});
			setMessage({
				text: `${resultado.sucesso.length} candidato(s) sincronizado(s) com sucesso.`,
				severity: "success",
			});
		} else {
			const idsComFalha = new Set(resultado.falhas.map((f) => f.idInscricao));
			setAtribuicaoLocal((prev) => {
				const next: Record<number, string> = {};
				for (const [id, bancaId] of Object.entries(prev)) {
					if (idsComFalha.has(Number(id))) next[Number(id)] = bancaId;
				}
				return next;
			});
			setMessage({
				text: `${resultado.sucesso.length} atribuído(s), ${resultado.falhas.length} com pendência — veja os detalhes abaixo.`,
				severity: "warning",
			});
		}
	};

	const colunas = useMemo<GridColDef[]>(
		() => [
			{ field: "nome", headerName: "Candidato", flex: 1, minWidth: 180 },
			{
				field: "docentesAtribuidos",
				headerName: "Avaliadores atuais",
				flex: 1,
				minWidth: 200,
				sortable: false,
				renderCell: (params) => {
					const row = params.row as CandidatoDistribuicao;
					if (row.docentesAtribuidos.length === 0) {
						return (
							<Typography
								variant="body2"
								color="text.disabled"
								sx={{ fontStyle: "italic" }}
							>
								Nenhum
							</Typography>
						);
					}
					return (
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
							{row.docentesAtribuidos.map((d) => (
								<Chip
									key={d.codigoDocente}
									label={d.nome}
									size="small"
									color={d.temNotaLancada ? "success" : "default"}
								/>
							))}
						</Box>
					);
				},
			},
			{
				field: "banca",
				headerName: "Banca",
				flex: 1,
				minWidth: 220,
				sortable: false,
				renderCell: (params) => {
					const row = params.row as CandidatoDistribuicao;
					const bancaIdPendente = atribuicaoLocal[row.idInscricao];
					const bancaPendente = bancaIdPendente
						? bancas.find((b) => b.id === bancaIdPendente)
						: undefined;
					const bancaSincronizada = encontrarBancaPorDocentes(
						row.docentesAtribuidos,
						bancas,
					);
					const banca = bancaPendente ?? bancaSincronizada;
					const pendente = Boolean(bancaPendente);
					return (
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							{banca ? (
								<Chip
									label={labelBanca(banca, docentesDisponiveis)}
									size="small"
									color={pendente ? "warning" : "default"}
								/>
							) : (
								<Typography
									variant="body2"
									color="text.disabled"
									sx={{ fontStyle: "italic" }}
								>
									Não atribuída
								</Typography>
							)}
							<Tooltip title="Alterar banca">
								<span>
									<IconButton
										size="small"
										onClick={(e) => abrirMenuBanca(e, row.idInscricao)}
										disabled={bancas.length === 0}
									>
										<EditIcon fontSize="small" />
									</IconButton>
								</span>
							</Tooltip>
						</Box>
					);
				},
			},
		],
		[atribuicaoLocal, bancas, docentesDisponiveis],
	);

	const rows = candidatos.map((c) => ({ id: c.idInscricao, ...c }));

	const formValido = form.codigosDocentes.length > 0 && (!mostrarPeriodo || !!form.periodo);

	return (
		<Box>
			<Card
				sx={{ backgroundColor: theme.palette.background.default, mb: 3 }}
			>
				<CardContent>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 2,
							flexWrap: "wrap",
							gap: 1,
						}}
					>
						<Typography variant="subtitle1">Bancas</Typography>
						<Button
							variant="contained"
							size="small"
							startIcon={<AddIcon />}
							onClick={abrirCriar}
						>
							Nova banca
						</Button>
					</Box>

					{bancas.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							Nenhuma banca criada. Crie ao menos uma banca para atribuir
							candidatos.
						</Typography>
					) : (
						<Stack
							direction="row"
							spacing={1}
							useFlexGap
							sx={{ flexWrap: "wrap" }}
						>
							{bancas.map((banca) => (
								<Chip
									key={banca.id}
									label={labelBanca(banca, docentesDisponiveis)}
									onClick={() => abrirEditar(banca)}
									onDelete={() => setConfirmarRemocao(banca)}
									deleteIcon={<DeleteIcon />}
									variant="outlined"
								/>
							))}
						</Stack>
					)}
				</CardContent>
			</Card>

			{erro && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{erro}
				</Alert>
			)}

			{falhas.length > 0 && (
				<Alert severity="warning" sx={{ mb: 2 }} onClose={() => setFalhas([])}>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						Pendências:
					</Typography>
					{falhas.map((f) => (
						<Typography key={f.idInscricao} variant="body2">
							Inscrição {f.idInscricao}: {f.motivo}
						</Typography>
					))}
				</Alert>
			)}

			<Card sx={{ backgroundColor: theme.palette.background.default }}>
				<CardContent
					sx={{ display: "flex", flexDirection: "column", height: "100%" }}
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
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography variant="subtitle1">Candidatos</Typography>
							<Chip
								label={`${candidatos.length} candidato${candidatos.length !== 1 ? "s" : ""}`}
								size="small"
								color="primary"
								variant="outlined"
							/>
						</Box>
						<Stack direction="row" spacing={1}>
							<Button
								variant="outlined"
								size="small"
								startIcon={<ShuffleIcon />}
								onClick={distribuirAutomaticamente}
								disabled={bancas.length === 0}
							>
								Distribuir automaticamente
							</Button>
							<Tooltip
								title={
									contadorPendentes === 0
										? "Nenhuma atribuição pendente"
										: `${contadorPendentes} pendente(s)`
								}
							>
								<span>
									<Badge badgeContent={contadorPendentes} color="warning" max={99}>
										<Button
											variant="contained"
											size="small"
											startIcon={
												salvando ? (
													<CircularProgress size={14} color="inherit" />
												) : (
													<SyncIcon />
												)
											}
											onClick={salvarAtribuicoes}
											disabled={contadorPendentes === 0 || salvando}
										>
											Sincronizar
										</Button>
									</Badge>
								</span>
							</Tooltip>
						</Stack>
					</Box>

					{candidatos.length === 0 ? (
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							Nenhum candidato homologado neste edital.
						</Typography>
					) : (
						<Box sx={{ flex: 1, minHeight: 400 }}>
							<CustomDataGrid
								rows={rows}
								columns={colunas}
								pageSize={Math.max(rows.length, 1)}
								pageSizeOptions={[Math.max(rows.length, 1)]}
								hideFooter
								getRowId={(row) => row.id}
								getRowHeight={() => "auto"}
								slots={{ toolbar: BarraBusca }}
								sx={{
									...dataGridBgSx(theme.palette.background.default),
									"& .MuiDataGrid-cell": { alignItems: "flex-start", py: 1 },
								}}
							/>
						</Box>
					)}
				</CardContent>
			</Card>

			{/* Menu de seleção de banca por candidato */}
			<Menu
				anchorEl={menuState.anchorEl}
				open={Boolean(menuState.anchorEl)}
				onClose={fecharMenuBanca}
				slotProps={{ paper: { sx: { minWidth: 260 } } }}
			>
				{bancas.length === 0 && (
					<MenuItem disabled dense>
						Nenhuma banca criada
					</MenuItem>
				)}
				{bancas.map((banca) => {
					const idInscricao = menuState.idInscricao;
					const candidato =
						idInscricao !== null
							? candidatos.find((c) => c.idInscricao === idInscricao)
							: undefined;
					const bancaEfetivaId =
						idInscricao !== null
							? (atribuicaoLocal[idInscricao] ??
								(candidato
									? encontrarBancaPorDocentes(
											candidato.docentesAtribuidos,
											bancas,
										)?.id
									: undefined))
							: undefined;
					return (
						<MenuItem
							key={banca.id}
							dense
							onClick={() => selecionarBanca(banca.id)}
						>
							<Radio
								checked={bancaEfetivaId === banca.id}
								size="small"
								sx={{ p: 0, mr: 1 }}
								readOnly
							/>
							<ListItemText
								primary={labelBanca(banca, docentesDisponiveis)}
							/>
						</MenuItem>
					);
				})}
			</Menu>

			{/* Dialog de criação/edição de banca */}
			<Dialog open={dialogAberto} onClose={fecharDialog} maxWidth="sm" fullWidth>
				<DialogTitle>{bancaEditando ? "Editar banca" : "Nova banca"}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						{mostrarPeriodo && (
							<FormControl fullWidth size="small">
								<InputLabel>Período</InputLabel>
								<Select
									value={form.periodo ?? "MANHA"}
									label="Período"
									onChange={(e) =>
										setForm((prev) => ({
											...prev,
											periodo: e.target.value as Periodo,
										}))
									}
								>
									{(Object.keys(LABEL_PERIODO) as Periodo[]).map((p) => (
										<MenuItem key={p} value={p}>
											{LABEL_PERIODO[p]}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}

						<TextField
							label="Data"
							type="date"
							size="small"
							slotProps={{ inputLabel: { shrink: true } }}
							value={form.data}
							onChange={(e) =>
								setForm((prev) => ({ ...prev, data: e.target.value }))
							}
							fullWidth
						/>

						<FormControl fullWidth size="small">
							<InputLabel id="docentes-banca-label">Docentes *</InputLabel>
							<Select
								labelId="docentes-banca-label"
								label="Docentes *"
								multiple
								value={form.codigosDocentes}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										codigosDocentes: e.target.value as string[],
									}))
								}
								input={<OutlinedInput label="Docentes *" />}
								renderValue={(selecionados) => (
									<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
										{(selecionados as string[]).map((codigo) => (
											<Chip
												key={codigo}
												label={
													docentesDisponiveis.find((d) => d.codigo === codigo)
														?.nome ?? codigo
												}
												size="small"
											/>
										))}
									</Box>
								)}
							>
								{docentesDisponiveis.map((docente) => {
									const selecionado = form.codigosDocentes.includes(
										docente.codigo,
									);
									return (
										<MenuItem key={docente.codigo} value={docente.codigo}>
											<Checkbox
												checked={selecionado}
												size="small"
												disableRipple
												tabIndex={-1}
											/>
											{docente.nome}
										</MenuItem>
									);
								})}
							</Select>
						</FormControl>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={fecharDialog} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={salvarBanca}
						variant="contained"
						disabled={!formValido}
					>
						{bancaEditando ? "Salvar" : "Criar"}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={Boolean(confirmarRemocao)} onClose={() => setConfirmarRemocao(null)}>
				<DialogTitle>Remover banca</DialogTitle>
				<DialogContent>
					<Typography>
						Deseja remover esta banca? Candidatos pendentes atribuídos a ela
						perderão a atribuição local.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmarRemocao(null)} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={() => confirmarRemocao && removerBanca(confirmarRemocao)}
						color="error"
						variant="contained"
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
