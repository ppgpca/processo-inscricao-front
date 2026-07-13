import { useState, useMemo } from "react";
import {
	Alert,
	Badge,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	FormControl,
	IconButton,
	InputLabel,
	ListItemText,
	Menu,
	MenuItem,
	Radio,
	Select,
	Tooltip,
	Typography,
} from "@mui/material";
import GavelIcon from "@mui/icons-material/Gavel";
import EditIcon from "@mui/icons-material/Edit";
import SyncIcon from "@mui/icons-material/Sync";
import type {
	GridColDef,
	GridColumnGroupingModel,
} from "@mui/x-data-grid";
import { useTheme } from "@mui/material/styles";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import { useNavigate } from "react-router";
import type {
	AvaliacaoInscrito,
	InscritoDashboard,
	NavegacaoEdicaoAvaliacao,
} from "../../types";
import CustomDataGrid from "../customs/CustomDataGrid";
import { useGerenciarCandidatos } from "../../hooks/useGerenciarCandidatos";

interface MenuState {
	anchorEl: HTMLElement | null;
	idInscricao: number | null;
	valorEfetivo: boolean | null;
}

const MENU_FECHADO: MenuState = {
	anchorEl: null,
	idInscricao: null,
	valorEfetivo: null,
};

const ALTURA_LINHA_AVALIACAO = 32;

function mascaraCpf(cpf: string): string {
	if (!cpf) return "";
	const limpo = cpf.replace(/\D/g, "");
	if (limpo.length !== 11) return cpf;
	return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 8)}*-**`;
}

function formatarData(dataStr: string): string {
	if (!dataStr) return "";
	const d = new Date(dataStr);
	if (isNaN(d.getTime())) return dataStr;
	return d.toLocaleDateString("pt-BR", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});
}

function formatarNota(nota: number | null): string {
	if (nota === null || nota === undefined || Number.isNaN(nota)) return "-";
	return Number(nota).toLocaleString("pt-BR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
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

function ChipDeferida({
	valor,
	pendente,
}: {
	valor: boolean | null;
	pendente: boolean;
}) {
	const chip = (() => {
		if (valor === true) {
			return (
				<Chip
					label="Sim"
					size="small"
					color="success"
					sx={pendente ? { opacity: 0.75 } : {}}
				/>
			);
		}
		if (valor === false) {
			return (
				<Chip
					label="Não"
					size="small"
					color="error"
					sx={pendente ? { opacity: 0.75 } : {}}
				/>
			);
		}
		return (
			<Chip
				label="Pendente"
				size="small"
				variant="outlined"
				sx={{
					backgroundColor: "transparent !important",
					borderColor: "text.secondary",
					color: "text.secondary",
					...(pendente ? { opacity: 0.75 } : {}),
				}}
			/>
		);
	})();

	if (!pendente) return chip;

	return (
		<Tooltip title="Alteração pendente de sincronização">
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
				{chip}
				<Box
					component="span"
					sx={{
						width: 7,
						height: 7,
						borderRadius: "50%",
						bgcolor: "warning.main",
						flexShrink: 0,
					}}
				/>
			</Box>
		</Tooltip>
	);
}

function CelulaAvaliacaoSubdividida({
	avaliacoes,
	campo,
	onAbrirMenuAvaliadores,
}: {
	avaliacoes: AvaliacaoInscrito[];
	campo: "nome" | "nota";
	onAbrirMenuAvaliadores?: (
		event: React.MouseEvent<HTMLElement>,
		avaliacao: AvaliacaoInscrito,
	) => void;
}) {
	if (!avaliacoes || avaliacoes.length === 0) {
		return (
			<Typography
				variant="body2"
				color="text.disabled"
				sx={{ fontStyle: "italic" }}
			>
				—
			</Typography>
		);
	}

	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "column",
				width: "100%",
				alignSelf: "stretch",
			}}
		>
			{avaliacoes.map((avaliacao, index) => (
				<Box
					key={avaliacao.idCriterio}
					sx={{
						minHeight: ALTURA_LINHA_AVALIACAO,
						display: "flex",
						alignItems: "center",
						justifyContent: campo === "nota" ? "flex-end" : "flex-start",
						gap: 0.25,
						px: 0.5,
						borderBottom:
							index < avaliacoes.length - 1
								? "1px solid"
								: "none",
						borderColor: "divider",
					}}
				>
					{campo === "nome" ? (
						<Typography variant="body2" sx={{ lineHeight: 1.2 }}>
							<Box component="span" sx={{ fontWeight: 700 }}>
								{avaliacao.nome}
							</Box>{" "}
							<Box
								component="span"
								sx={{ fontWeight: 400, color: "text.secondary" }}
							>
								({avaliacao.qtdAvaliadores ?? 0})
							</Box>
						</Typography>
					) : (
						<>
							<Typography
								variant="body2"
								sx={{
									lineHeight: 1.2,
									fontVariantNumeric: "tabular-nums",
								}}
								color={
									avaliacao.nota === null
										? "text.disabled"
										: "text.primary"
								}
							>
								{formatarNota(avaliacao.nota)}
							</Typography>
							{onAbrirMenuAvaliadores && (
								<Tooltip
									title={
										(avaliacao.avaliadores?.length ?? 0) === 0
											? "Nenhum avaliador atribuiu nota"
											: "Editar nota de um avaliador"
									}
								>
									<span>
										<IconButton
											size="small"
											disabled={
												(avaliacao.avaliadores?.length ?? 0) === 0
											}
											onClick={(e) => {
												e.stopPropagation();
												onAbrirMenuAvaliadores(e, avaliacao);
											}}
											sx={{ p: 0.25 }}
										>
											<EditIcon sx={{ fontSize: 16 }} />
										</IconButton>
									</span>
								</Tooltip>
							)}
						</>
					)}
				</Box>
			))}
		</Box>
	);
}

const columnGroupingModel: GridColumnGroupingModel = [
	{
		groupId: "avaliacoes",
		headerName: "Avaliações",
		headerAlign: "center",
		children: [
			{ field: "avaliacaoCriterio" },
			{ field: "avaliacaoNota" },
		],
	},
];

export default function GerenciarCandidatos() {
	const theme = useTheme();
	const navigate = useNavigate();
	const {
		editais,
		editalSelecionado,
		setEditalSelecionado,
		inscritos,
		loading,
		loadingEditais,
		erro,
		alteracoesPendentes,
		contadorPendentes,
		sincronizando,
		marcarDeferida,
		sincronizar,
	} = useGerenciarCandidatos();

	const [menuState, setMenuState] = useState<MenuState>(MENU_FECHADO);
	const [menuAvaliadores, setMenuAvaliadores] = useState<{
		anchorEl: HTMLElement | null;
		inscrito: InscritoDashboard | null;
		avaliacao: AvaliacaoInscrito | null;
		codigoSelecionado: string;
	}>({
		anchorEl: null,
		inscrito: null,
		avaliacao: null,
		codigoSelecionado: "",
	});

	const handleAbrirMenu = (
		event: React.MouseEvent<HTMLElement>,
		idInscricao: number,
		valorEfetivo: boolean | null,
	) => {
		setMenuState({ anchorEl: event.currentTarget, idInscricao, valorEfetivo });
	};

	const handleFecharMenu = () => setMenuState(MENU_FECHADO);

	const handleSelecionarDeferida = (valor: boolean) => {
		if (menuState.idInscricao === null) return;
		marcarDeferida(menuState.idInscricao, valor);
		handleFecharMenu();
	};

	const handleAbrirMenuAvaliadores = (
		event: React.MouseEvent<HTMLElement>,
		inscrito: InscritoDashboard,
		avaliacao: AvaliacaoInscrito,
	) => {
		setMenuAvaliadores({
			anchorEl: event.currentTarget,
			inscrito,
			avaliacao,
			codigoSelecionado: "",
		});
	};

	const handleFecharMenuAvaliadores = () => {
		setMenuAvaliadores({
			anchorEl: null,
			inscrito: null,
			avaliacao: null,
			codigoSelecionado: "",
		});
	};

	const handleSelecionarAvaliador = (codigoDocente: string) => {
		const { inscrito, avaliacao } = menuAvaliadores;
		if (!inscrito || !avaliacao || !editalSelecionado) return;

		const state: NavegacaoEdicaoAvaliacao = {
			origem: "candidatos",
			idEdital: Number(editalSelecionado),
			codigoDocente,
			criterio: {
				id: avaliacao.idCriterio,
				idCriterioPai: null,
				nome: avaliacao.nome,
				descricao: avaliacao.descricao ?? null,
				notaMaxima: avaliacao.notaMaxima,
				peso: avaliacao.peso,
				ordem: avaliacao.ordem,
			},
			candidato: {
				idInscricao: inscrito.idInscricao,
				cpf: inscrito.cpf,
				anteprojeto: inscrito.anteprojeto,
				palavrasChave: inscrito.palavrasChave ?? [],
				nota: avaliacao.nota ?? 0,
				comentario: null,
			},
		};

		handleFecharMenuAvaliadores();
		navigate("/gestao/avaliacao", { state });
	};

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
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
							{palavras.map((palavra) => (
								<Chip key={palavra} label={palavra} size="small" />
							))}
						</Box>
					);
				},
			},
			{
				field: "avaliacaoCriterio",
				headerName: "Critério",
				width: 180,
				sortable: false,
				filterable: false,
				renderCell: (params) => (
					<CelulaAvaliacaoSubdividida
						avaliacoes={
							(params.row as InscritoDashboard).avaliacoes ?? []
						}
						campo="nome"
					/>
				),
			},
			{
				field: "avaliacaoNota",
				headerName: "Nota",
				width: 120,
				sortable: false,
				filterable: false,
				align: "right",
				headerAlign: "right",
				renderCell: (params) => {
					const row = params.row as InscritoDashboard;
					return (
						<CelulaAvaliacaoSubdividida
							avaliacoes={row.avaliacoes ?? []}
							campo="nota"
							onAbrirMenuAvaliadores={(e, avaliacao) =>
								handleAbrirMenuAvaliadores(e, row, avaliacao)
							}
						/>
					);
				},
			},
			{
				field: "dataInscricao",
				headerName: "Data de inscrição",
				width: 150,
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
				field: "deferida",
				headerName: "Deferida",
				width: 140,
				sortable: true,
				renderCell: (params) => {
					const row = params.row as InscritoDashboard;
					const temPendente = row.idInscricao in alteracoesPendentes;
					const valorEfetivo = temPendente
						? alteracoesPendentes[row.idInscricao]
						: (params.value as boolean | null);
					return (
						<ChipDeferida valor={valorEfetivo} pendente={temPendente} />
					);
				},
			},
			{
				field: "acoes",
				headerName: "Ações",
				width: 80,
				sortable: false,
				filterable: false,
				align: "center",
				headerAlign: "center",
				renderCell: (params) => {
					const row = params.row as InscritoDashboard;
					const temPendente = row.idInscricao in alteracoesPendentes;
					const valorEfetivo = temPendente
						? alteracoesPendentes[row.idInscricao]
						: row.deferida;
					return (
						<Tooltip title="Deferir / Indeferir">
							<IconButton
								size="small"
								onClick={(e) =>
									handleAbrirMenu(e, row.idInscricao, valorEfetivo)
								}
								color="inherit"
							>
								<GavelIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					);
				},
			},
		],
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[alteracoesPendentes, editalSelecionado],
	);

	const rows = inscritos.map((inscrito: InscritoDashboard) => ({
		id: inscrito.idInscricao,
		...inscrito,
	}));

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 3 }}>
				Gerenciar Candidatos
			</Typography>

			<FormControl fullWidth sx={{ mb: 3, maxWidth: 480 }}>
				<InputLabel id="select-edital-label">Selecionar edital</InputLabel>
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

			{erro && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{erro}
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
								<Typography variant="subtitle1">
									Candidatos inscritos
								</Typography>
								<Chip
									label={`${inscritos.length} inscri${inscritos.length !== 1 ? "ções" : "ção"}`}
									size="small"
									color="primary"
									variant="outlined"
								/>
							</Box>

							<Tooltip
								title={
									contadorPendentes === 0
										? "Nenhuma alteração pendente"
										: `${contadorPendentes} alteraç${contadorPendentes !== 1 ? "ões" : "ão"} pendente${contadorPendentes !== 1 ? "s" : ""}`
								}
							>
								<span>
									<Badge
										badgeContent={contadorPendentes}
										color="warning"
										max={99}
									>
										<Button
											variant="contained"
											size="small"
											startIcon={
												sincronizando ? (
													<CircularProgress size={14} color="inherit" />
												) : (
													<SyncIcon />
												)
											}
											onClick={sincronizar}
											disabled={contadorPendentes === 0 || sincronizando}
										>
											Sincronizar
										</Button>
									</Badge>
								</span>
							</Tooltip>
						</Box>

						{inscritos.length === 0 ? (
							<Typography
								variant="body2"
								color="text.secondary"
								sx={{ mt: 1 }}
							>
								Nenhum candidato inscrito neste edital.
							</Typography>
						) : (
							<Box sx={{ flex: 1, minHeight: 400 }}>
								<CustomDataGrid
									rows={rows}
									columns={colunas}
									pageSize={10}
									getRowId={(row) => row.id}
									getRowHeight={() => "auto"}
									columnGroupingModel={columnGroupingModel}
									slots={{ toolbar: BarraBusca }}
									sx={{
										...dataGridBgSx(theme.palette.background.default),
										"& .MuiDataGrid-cell": {
											alignItems: "flex-start",
											py: 1,
										},
										"& .MuiDataGrid-columnHeader--filledGroup": {
											"& .MuiDataGrid-columnHeaderTitleContainer": {
												justifyContent: "center",
											},
										},
									}}
								/>
							</Box>
						)}
					</CardContent>
				</Card>
			) : null}

			{/* Menu de deferimento */}
			<Menu
				anchorEl={menuState.anchorEl}
				open={Boolean(menuState.anchorEl)}
				onClose={handleFecharMenu}
				slotProps={{ paper: { sx: { minWidth: 180 } } }}
			>
				<MenuItem
					dense
					onClick={() => handleSelecionarDeferida(true)}
				>
					<Radio
						checked={menuState.valorEfetivo === true}
						size="small"
						sx={{ p: 0, mr: 1 }}
						readOnly
					/>
					<ListItemText primary="Deferir" />
				</MenuItem>
				<MenuItem
					dense
					onClick={() => handleSelecionarDeferida(false)}
				>
					<Radio
						checked={menuState.valorEfetivo === false}
						size="small"
						sx={{ p: 0, mr: 1 }}
						readOnly
					/>
					<ListItemText primary="Indeferir" />
				</MenuItem>
			</Menu>

			{/* Menu de avaliadores para edição de nota */}
			<Menu
				anchorEl={menuAvaliadores.anchorEl}
				open={Boolean(menuAvaliadores.anchorEl)}
				onClose={handleFecharMenuAvaliadores}
				slotProps={{ paper: { sx: { minWidth: 240 } } }}
			>
				<Typography
					variant="caption"
					color="text.secondary"
					sx={{ px: 2, pt: 1, pb: 0.5, display: "block" }}
				>
					Selecione o avaliador
				</Typography>
				{(menuAvaliadores.avaliacao?.avaliadores ?? []).map((avaliador) => (
					<MenuItem
						key={avaliador.codigoDocente}
						dense
						onClick={() =>
							handleSelecionarAvaliador(avaliador.codigoDocente)
						}
					>
						<Radio
							checked={
								menuAvaliadores.codigoSelecionado ===
								avaliador.codigoDocente
							}
							size="small"
							sx={{ p: 0, mr: 1 }}
							readOnly
						/>
						<ListItemText primary={avaliador.nome} />
					</MenuItem>
				))}
			</Menu>
		</Box>
	);
}
