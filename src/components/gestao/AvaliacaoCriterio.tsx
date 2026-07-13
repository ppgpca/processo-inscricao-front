import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	LinearProgress,
	Snackbar,
	TextField,
	Typography,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import { useTheme } from "@mui/material/styles";
import type { GridColDef } from "@mui/x-data-grid";
import type { CandidatoAvaliacao, CriterioAvaliacao } from "../../types";
import { docenteService } from "../../services/docente.service";
import CustomDataGrid from "../customs/CustomDataGrid";

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

/**
 * Campo de nota isolado com estado local para evitar perda de foco.
 * Funciona tanto dentro do DataGrid quanto standalone (modo folha).
 */
const NotaCell = memo(function NotaCell({
	criterioId,
	notaMaxima,
	valorInicial = 0,
	onNotaChange,
	onErrorChange,
	size = "small",
}: {
	criterioId: number;
	notaMaxima: number;
	valorInicial?: number;
	onNotaChange: (id: number, valor: number) => void;
	onErrorChange: (id: number, hasError: boolean) => void;
	size?: "small" | "medium";
}) {
	const [rawValue, setRawValue] = useState(() => String(valorInicial));

	useEffect(() => {
		setRawValue(String(valorInicial));
	}, [valorInicial]);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const raw = e.target.value;
		setRawValue(raw);

		const num = parseFloat(raw.replace(",", "."));
		if (isNaN(num) || raw === "" || raw === "-") {
			onNotaChange(criterioId, 0);
			onErrorChange(criterioId, false);
			return;
		}

		const excedeu = num > notaMaxima;
		const abaixo = num < 0;
		const hasError = excedeu || abaixo;
		onErrorChange(criterioId, hasError);
		onNotaChange(criterioId, hasError ? 0 : num);
	};

	const numericValue = parseFloat(rawValue.replace(",", "."));
	const excedeuMaximo = !isNaN(numericValue) && numericValue > notaMaxima;
	const abaixoMinimo = !isNaN(numericValue) && numericValue < 0;
	const hasError = excedeuMaximo || abaixoMinimo;

	return (
		<TextField
			type="number"
			size={size}
			value={rawValue}
			onChange={handleChange}
			error={hasError}
			helperText={
				excedeuMaximo
					? `Máximo: ${notaMaxima}`
					: abaixoMinimo
						? "Mínimo: 0"
						: undefined
			}
			inputProps={{ min: 0, max: notaMaxima, step: 0.1 }}
			sx={{ width: size === "medium" ? 200 : 140 }}
		/>
	);
});

interface SubCriterioRow {
	id: number;
	nome: string;
	notaMaxima: number;
	nota: number;
}

interface Props {
	criterio: CriterioAvaliacao;
	candidato: CandidatoAvaliacao;
	/** Quando informado (admin/coordenador), salva as notas em nome deste avaliador. */
	codigoDocente?: string;
	onVoltar: () => void;
}

export default function AvaliacaoCriterio({
	criterio,
	candidato,
	codigoDocente,
	onVoltar,
}: Props) {
	const theme = useTheme();

	const [subCriterios, setSubCriterios] = useState<SubCriterioRow[]>([]);
	const [isLeaf, setIsLeaf] = useState(false);
	const [loading, setLoading] = useState(true);
	const [erro, setErro] = useState<string | null>(null);
	const [notasCarregadas, setNotasCarregadas] = useState(false);

	// Ref para notas válidas sem causar re-render no DataGrid
	const notasRef = useRef<Record<number, number>>({});
	const [notasIniciais, setNotasIniciais] = useState<Record<number, number>>(
		{},
	);
	const [somatorio, setSomatorio] = useState(0);

	// Rastreio de erros de validação por célula
	const errorsRef = useRef<Record<number, boolean>>({});
	const [hasErrors, setHasErrors] = useState(false);

	// Estado do salvamento
	const [salvando, setSalvando] = useState(false);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		severity: "success" | "error";
		message: string;
	}>({ open: false, severity: "success", message: "" });

	useEffect(() => {
		const carregar = async () => {
			setLoading(true);
			setNotasCarregadas(false);
			setErro(null);
			try {
				const [subs, notasGravadas] = await Promise.all([
					docenteService.findSubCriteriosByPai(criterio.id),
					docenteService.findNotasPorInscricaoECriterio(
						candidato.idInscricao,
						criterio.id,
						codigoDocente,
					),
				]);

				const listaNotas = Array.isArray(notasGravadas)
					? notasGravadas
					: [];
				const notasMap: Record<number, number> = {};
				for (const n of listaNotas) {
					if (n.nota !== null && n.nota !== undefined) {
						notasMap[Number(n.idCriterioAvaliacao)] = Number(n.nota);
					}
				}

				if (subs.length === 0) {
					// Critério folha: usa o próprio critério como única nota
					const notaFolha = notasMap[criterio.id] ?? 0;
					setIsLeaf(true);
					setSubCriterios([]);
					notasRef.current = { [criterio.id]: notaFolha };
					errorsRef.current = { [criterio.id]: false };
					setNotasIniciais({ [criterio.id]: notaFolha });
					setSomatorio(notaFolha);
				} else {
					setIsLeaf(false);
					const rows: SubCriterioRow[] = subs.map((s) => ({
						id: s.id,
						nome: s.nome,
						notaMaxima: Number(s.notaMaxima),
						nota: notasMap[s.id] ?? 0,
					}));
					setSubCriterios(rows);
					const init: Record<number, number> = {};
					const initErrors: Record<number, boolean> = {};
					rows.forEach((r) => {
						init[r.id] = r.nota;
						initErrors[r.id] = false;
					});
					notasRef.current = init;
					errorsRef.current = initErrors;
					setNotasIniciais(init);
					setSomatorio(
						Object.values(init).reduce((a, b) => a + b, 0),
					);
				}

				setHasErrors(false);
				setNotasCarregadas(true);
			} catch {
				setErro("Não foi possível carregar os subcritérios e notas.");
				setNotasCarregadas(true);
			} finally {
				setLoading(false);
			}
		};
		carregar();
	}, [criterio.id, candidato.idInscricao, codigoDocente]);

	const onNotaChange = useCallback((id: number, valor: number) => {
		notasRef.current[id] = valor;
		const sum = Object.values(notasRef.current).reduce((a, b) => a + b, 0);
		setSomatorio(sum);
	}, []);

	const onErrorChange = useCallback((id: number, error: boolean) => {
		errorsRef.current[id] = error;
		setHasErrors(Object.values(errorsRef.current).some(Boolean));
	}, []);

	const handleSalvar = async () => {
		if (hasErrors || salvando) return;
		setSalvando(true);
		try {
			let payload: {
				idInscricao: number;
				idCriterioAvaliacao: number;
				nota: number;
			}[];

			if (isLeaf) {
				// Critério folha: salva apenas a nota do próprio critério
				payload = [
					{
						idInscricao: candidato.idInscricao,
						idCriterioAvaliacao: criterio.id,
						nota: notasRef.current[criterio.id] ?? 0,
					},
				];
			} else {
				// Critério com filhos: salva notas individuais + somatório no pai
				const notasSubCriterios = Object.entries(notasRef.current).map(
					([idCriterioAvaliacao, nota]) => ({
						idInscricao: candidato.idInscricao,
						idCriterioAvaliacao: Number(idCriterioAvaliacao),
						nota,
					}),
				);
				const notaTotal = Object.values(notasRef.current).reduce(
					(a, b) => a + b,
					0,
				);
				payload = [
					...notasSubCriterios,
					{
						idInscricao: candidato.idInscricao,
						idCriterioAvaliacao: criterio.id,
						nota: notaTotal,
					},
				];
			}

			await docenteService.salvarNotas(payload, codigoDocente);
			setSnackbar({
				open: true,
				severity: "success",
				message: "Nota salva com sucesso!",
			});
		} catch {
			setSnackbar({
				open: true,
				severity: "error",
				message: "Erro ao salvar. Tente novamente.",
			});
		} finally {
			setSalvando(false);
		}
	};

	const colunas = useMemo<GridColDef[]>(
		() => [
			{
				field: "nome",
				headerName: "Critério",
				flex: 1,
				minWidth: 200,
				editable: false,
			},
			{
				field: "notaMaxima",
				headerName: "Nota máxima",
				width: 130,
				editable: false,
				align: "center",
				headerAlign: "center",
				renderCell: (params) => (
					<Typography variant="body2" color="text.secondary">
						{params.value}
					</Typography>
				),
			},
			{
				field: "nota",
				headerName: "Nota",
				width: 180,
				editable: false,
				sortable: false,
				renderCell: (params) => (
					<NotaCell
						key={`${params.row.id}-${params.row.nota}`}
						criterioId={params.row.id as number}
						notaMaxima={params.row.notaMaxima as number}
						valorInicial={params.row.nota as number}
						onNotaChange={onNotaChange}
						onErrorChange={onErrorChange}
					/>
				),
			},
		],
		[onNotaChange, onErrorChange],
	);

	const notaMaximaPai = Number(criterio.notaMaxima);
	const percentual =
		notaMaximaPai > 0
			? Math.min((somatorio / notaMaximaPai) * 100, 100)
			: 0;
	const excedeu = somatorio > notaMaximaPai;

	return (
		<Box>
			{/* Barra de ações: Voltar + Salvar */}
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
				<Button
					startIcon={<ArrowBackIcon />}
					onClick={onVoltar}
					variant="text"
				>
					Voltar
				</Button>

				{!loading && (
					<Button
						variant="contained"
						startIcon={
							salvando ? (
								<CircularProgress size={16} color="inherit" />
							) : (
								<SaveIcon />
							)
						}
						onClick={handleSalvar}
						disabled={hasErrors || salvando}
					>
						{salvando ? "Salvando…" : "Salvar"}
					</Button>
				)}
			</Box>

			{/* Cabeçalho do candidato */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.5,
					mb: 3,
					flexWrap: "wrap",
				}}
			>
				<Typography variant="body1" sx={{ fontFamily: "monospace" }}>
					{mascaraCpf(candidato.cpf)}
				</Typography>
				{candidato.anteprojeto && (
					<Typography variant="body1" color="text.secondary">
						— {candidato.anteprojeto}
					</Typography>
				)}
				{candidato.palavrasChave?.map((p) => (
					<Chip key={p} label={p} size="small" />
				))}
			</Box>

			{/* Informações do critério */}
			<Card
				sx={{
					mb: 3,
					backgroundColor: theme.palette.background.default,
				}}
			>
				<CardContent>
					<Typography variant="h6" gutterBottom>
						{criterio.nome}
					</Typography>
					{criterio.descricao && (
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{ mb: 1.5 }}
						>
							{criterio.descricao}
						</Typography>
					)}
					<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
						<Chip
							label={`Nota máxima: ${criterio.notaMaxima}`}
							size="small"
							color="primary"
							variant="outlined"
						/>
						<Chip
							label={`Peso: ${criterio.peso}`}
							size="small"
							variant="outlined"
						/>
						{isLeaf && !loading && (
							<Chip
								label="Critério folha"
								size="small"
								variant="outlined"
								color="secondary"
							/>
						)}
					</Box>
				</CardContent>
			</Card>

			{erro && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{erro}
				</Alert>
			)}

			{loading || !notasCarregadas ? (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
					<CircularProgress />
				</Box>
			) : isLeaf ? (
				/* ── Modo folha: campo único de nota ── */
				<Card sx={{ backgroundColor: theme.palette.background.default }}>
					<CardContent>
						{hasErrors && (
							<Alert severity="warning" sx={{ mb: 2 }}>
								Corrija o campo antes de salvar.
							</Alert>
						)}

						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 2,
								mb: 2,
							}}
						>
							<NotaCell
								key={`folha-${criterio.id}-${notasIniciais[criterio.id] ?? 0}`}
								criterioId={criterio.id}
								notaMaxima={notaMaximaPai}
								valorInicial={notasIniciais[criterio.id] ?? 0}
								onNotaChange={onNotaChange}
								onErrorChange={onErrorChange}
								size="medium"
							/>
							<Typography variant="body1" color="text.secondary">
								/ {notaMaximaPai}
							</Typography>
						</Box>

						<LinearProgress
							variant="determinate"
							value={percentual}
							color={excedeu ? "error" : "primary"}
							sx={{ height: 8, borderRadius: 4 }}
						/>
						{excedeu && (
							<Typography
								variant="caption"
								color="error"
								sx={{ mt: 0.5, display: "block" }}
							>
								Nota excede o máximo permitido ({notaMaximaPai}).
							</Typography>
						)}
					</CardContent>
				</Card>
			) : (
				/* ── Modo com filhos: grid + somatório ── */
				<>
					{hasErrors && (
						<Alert severity="warning" sx={{ mb: 2 }}>
							Corrija os campos com erro antes de salvar.
						</Alert>
					)}

					<Card
						sx={{ backgroundColor: theme.palette.background.default }}
					>
						<CardContent
							sx={{ "&:last-child": { paddingBottom: "8px" } }}
						>
							<Box sx={{ minHeight: 200 }}>
								<CustomDataGrid
									key={`avaliacao-${criterio.id}-${candidato.idInscricao}-${codigoDocente ?? "me"}`}
									rows={subCriterios}
									columns={colunas}
									pageSize={25}
									getRowId={(row) => row.id}
									getRowHeight={() => "auto"}
									hideFooter={subCriterios.length <= 25}
									disableVirtualization
									disableColumnFilter
									disableColumnMenu
									sx={{
										...dataGridBgSx(
											theme.palette.background.default,
										),
										"& .MuiDataGrid-cell": {
											alignItems: "center",
											py: 1,
										},
									}}
								/>
							</Box>
						</CardContent>
					</Card>

					{/* Somatório */}
					<Card
						sx={{
							mt: 2,
							backgroundColor: theme.palette.background.default,
						}}
					>
						<CardContent>
							<Divider sx={{ mb: 2 }} />
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									mb: 1.5,
								}}
							>
								<Typography variant="subtitle1">
									Somatório
								</Typography>
								<Box
									sx={{
										display: "flex",
										alignItems: "baseline",
										gap: 0.5,
									}}
								>
									<Typography
										variant="h5"
										color={excedeu ? "error" : "text.primary"}
										sx={{ fontWeight: 700 }}
									>
										{somatorio.toFixed(1)}
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
									>
										/ {notaMaximaPai}
									</Typography>
								</Box>
							</Box>
							<LinearProgress
								variant="determinate"
								value={percentual}
								color={excedeu ? "error" : "primary"}
								sx={{ height: 8, borderRadius: 4 }}
							/>
							{excedeu && (
								<Typography
									variant="caption"
									color="error"
									sx={{ mt: 0.5, display: "block" }}
								>
									Somatório excede a nota máxima do critério (
									{notaMaximaPai}).
								</Typography>
							)}
						</CardContent>
					</Card>
				</>
			)}

			<Snackbar
				open={snackbar.open}
				autoHideDuration={4000}
				onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					severity={snackbar.severity}
					onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
					sx={{ width: "100%" }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
}
