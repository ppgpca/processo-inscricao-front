import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
	Tab,
	Tabs,
	Tooltip,
	Typography,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useTheme } from "@mui/material/styles";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import type { GridColDef } from "@mui/x-data-grid";
import { useLocation, useNavigate } from "react-router";
import type {
	CandidatoAvaliacao,
	CriterioAvaliacao,
	NavegacaoEdicaoAvaliacao,
	SiglaEtapaDistribuicao,
} from "../../types";
import CustomDataGrid from "../customs/CustomDataGrid";
import { useAvaliarCandidatos } from "../../hooks/useAvaliarCandidatos";
import AvaliacaoCriterio from "./AvaliacaoCriterio";

const ABAS: {
	sigla: SiglaEtapaDistribuicao;
	label: string;
	nomeCriterio: string;
}[] = [
	{ sigla: "ANTEPROJETO", label: "Anteprojeto", nomeCriterio: "Anteprojeto" },
	{ sigla: "ENTREVISTA", label: "Entrevista", nomeCriterio: "Entrevista" },
	{
		sigla: "ANALISE_CURRICULO",
		label: "Currículo",
		nomeCriterio: "Currículo",
	},
];

function mascaraCpf(cpf: string): string {
	if (!cpf) return "";
	const limpo = cpf.replace(/\D/g, "");
	if (limpo.length !== 11) return cpf;
	return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 8)}*-**`;
}

function siglaPorNomeCriterio(
	nome: string | undefined,
): SiglaEtapaDistribuicao {
	const normalizado = nome?.trim().toLowerCase() ?? "";
	const aba = ABAS.find(
		(item) => item.nomeCriterio.toLowerCase() === normalizado,
	);
	return aba?.sigla ?? "ANTEPROJETO";
}

/** Formata ISO do slot da banca como dd/mm/yyyy HH:MM. */
function formatarSlotBanca(iso: string | null | undefined): string {
	if (!iso) return "—";
	const d = new Date(iso);
	if (Number.isNaN(d.getTime())) return "—";
	const dia = String(d.getDate()).padStart(2, "0");
	const mes = String(d.getMonth() + 1).padStart(2, "0");
	const ano = d.getFullYear();
	const hh = String(d.getHours()).padStart(2, "0");
	const mm = String(d.getMinutes()).padStart(2, "0");
	return `${dia}/${mes}/${ano} ${hh}:${mm}`;
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

/** Referências estáveis — evitar re-medida contínua do DataGrid com altura automática. */
const getAutoRowHeight = () => "auto" as const;
const getEstimatedRowHeight = () => 72;

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

interface AvaliacaoAtiva {
	candidato: CandidatoAvaliacao;
	criterio: CriterioAvaliacao;
	codigoDocente?: string;
	voltarParaCandidatos?: boolean;
	idEdital?: number;
}

export default function AvaliarCandidatos() {
	const theme = useTheme();
	const location = useLocation();
	const navigate = useNavigate();
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
	} = useAvaliarCandidatos();

	const stateOrigem = location.state as NavegacaoEdicaoAvaliacao | null;
	const veioDeCandidatos = stateOrigem?.origem === "candidatos";

	const [abaAtiva, setAbaAtiva] = useState<SiglaEtapaDistribuicao>(() =>
		veioDeCandidatos && stateOrigem
			? siglaPorNomeCriterio(stateOrigem.criterio.nome)
			: "ANTEPROJETO",
	);

	const [avaliacaoAtiva, setAvaliacaoAtiva] = useState<AvaliacaoAtiva | null>(
		() =>
			veioDeCandidatos && stateOrigem
				? {
						candidato: stateOrigem.candidato,
						criterio: stateOrigem.criterio,
						codigoDocente: stateOrigem.codigoDocente,
						voltarParaCandidatos: true,
						idEdital: stateOrigem.idEdital,
					}
				: null,
	);

	useEffect(() => {
		if (!veioDeCandidatos || !stateOrigem) return;
		setEditalSelecionado(stateOrigem.idEdital);
		setAbaAtiva(siglaPorNomeCriterio(stateOrigem.criterio.nome));
		setCriterioSelecionado(stateOrigem.criterio.id);
	}, [
		veioDeCandidatos,
		stateOrigem,
		setEditalSelecionado,
		setCriterioSelecionado,
	]);

	useEffect(() => {
		const aba = ABAS.find((item) => item.sigla === abaAtiva);
		if (!aba || criterios.length === 0) {
			setCriterioSelecionado("");
			return;
		}
		const criterio = criterios.find(
			(item) =>
				item.nome.trim().toLowerCase() ===
				aba.nomeCriterio.toLowerCase(),
		);
		setCriterioSelecionado(criterio?.id ?? "");
	}, [abaAtiva, criterios, setCriterioSelecionado]);

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

	const handleVoltarAvaliacao = () => {
		if (avaliacaoAtiva?.voltarParaCandidatos) {
			navigate("/gestao/candidatos", {
				state: { idEdital: avaliacaoAtiva.idEdital },
			});
			return;
		}
		setAvaliacaoAtiva(null);
	};

	const criterioEntrevista = abaAtiva === "ENTREVISTA";

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
				headerName: "Título do projeto",
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
				field: "linhaPesquisa",
				headerName: "Linha de pesquisa",
				width: 180,
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
								<Chip
									key={palavra}
									label={palavra}
									size="small"
								/>
							))}
						</Box>
					);
				},
			},
			...(criterioEntrevista
				? [
						{
							field: "dataBanca",
							headerName: "Data/horário da entrevista",
							width: 170,
							valueGetter: (
								_value: unknown,
								row: CandidatoAvaliacao,
							) => row.dataBanca ?? "",
							renderCell: (params: {
								row: CandidatoAvaliacao;
							}) => (
								<span style={{ whiteSpace: "nowrap" }}>
									{formatarSlotBanca(params.row.dataBanca)}
								</span>
							),
						} satisfies GridColDef,
					]
				: []),
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
								handleRowClick(
									params.row as CandidatoAvaliacao,
								);
							}}
						>
							<EditIcon fontSize="small" />
						</IconButton>
					</Tooltip>
				),
			},
		],
		[criterioEntrevista, handleRowClick],
	);

	const rows = useMemo(() => {
		const lista = candidatos.map((c: CandidatoAvaliacao) => ({
			id: c.idInscricao,
			...c,
		}));
		if (!criterioEntrevista) return lista;
		return [...lista].sort((a, b) => {
			if (!a.dataBanca && !b.dataBanca) return 0;
			if (!a.dataBanca) return 1;
			if (!b.dataBanca) return -1;
			return (
				new Date(a.dataBanca).getTime() -
				new Date(b.dataBanca).getTime()
			);
		});
	}, [candidatos, criterioEntrevista]);

	const dataGridSx = useMemo(
		() => ({
			...dataGridBgSx(theme.palette.background.default),
			height: "auto",
			"& .MuiDataGrid-main": {
				overflow: "visible",
			},
			"& .MuiDataGrid-virtualScroller": {
				overflow: "visible !important",
			},
			"& .MuiDataGrid-virtualScrollerContent": {
				height: "auto !important",
			},
			"& .MuiDataGrid-virtualScrollerRenderZone": {
				position: "relative !important",
			},
			"& .MuiDataGrid-row": {
				cursor: "pointer",
			},
			"& .MuiDataGrid-row:hover": {
				backgroundColor: theme.palette.action.hover,
			},
			"& .MuiDataGrid-cell": {
				alignItems: "flex-start",
				py: 1,
			},
		}),
		[theme.palette.action.hover, theme.palette.background.default],
	);

	// Quando há avaliação ativa, exibe o componente de avaliação de critério
	if (avaliacaoAtiva) {
		return (
			<AvaliacaoCriterio
				criterio={avaliacaoAtiva.criterio}
				candidato={avaliacaoAtiva.candidato}
				codigoDocente={avaliacaoAtiva.codigoDocente}
				onVoltar={handleVoltarAvaliacao}
			/>
		);
	}

	const renderConteudo = () => {
		if (!editalSelecionado) {
			return (
				<Typography variant="body2" color="text.secondary">
					Selecione um edital para continuar.
				</Typography>
			);
		}

		if (loadingCriterios || loadingCandidatos) {
			return (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
					<CircularProgress />
				</Box>
			);
		}

		if (!criterioSelecionado || !criterioAtual) {
			return (
				<Typography variant="body2" color="text.secondary">
					Nenhum critério correspondente a esta etapa no edital
					selecionado.
				</Typography>
			);
		}

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
						<Chip
							label={`Nota máx: ${criterioAtual.notaMaxima} · Peso: ${criterioAtual.peso}`}
							size="small"
							variant="outlined"
							color="secondary"
						/>
					</Box>

					{criterioAtual.descricao && (
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
							Nenhum candidato atribuído a você para este
							critério.
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
							<Box
								sx={{
									width: "100%",
									"& > div": { height: "auto !important" },
								}}
							>
								<CustomDataGrid
									rows={rows}
									columns={colunas}
									pageSize={Math.max(rows.length, 1)}
									pageSizeOptions={[Math.max(rows.length, 1)]}
									hideFooter
									getRowId={(row) => row.id}
									getRowHeight={getAutoRowHeight}
									getEstimatedRowHeight={getEstimatedRowHeight}
									disableVirtualization
									slots={{ toolbar: BarraBusca }}
									onRowClick={(params) =>
										handleRowClick(
											params.row as CandidatoAvaliacao,
										)
									}
									sx={dataGridSx}
								/>
							</Box>
						</>
					)}
				</CardContent>
			</Card>
		);
	};

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 3 }}>
				Avaliar Candidatos
			</Typography>

			<FormControl fullWidth sx={{ mb: 3, maxWidth: 480 }}>
				<InputLabel id="select-edital-avaliacao-label">
					Selecionar edital
				</InputLabel>
				<Select
					labelId="select-edital-avaliacao-label"
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

			<Tabs
				value={abaAtiva}
				onChange={(_, valor: SiglaEtapaDistribuicao) =>
					setAbaAtiva(valor)
				}
				sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
			>
				{ABAS.map((aba) => (
					<Tab key={aba.sigla} value={aba.sigla} label={aba.label} />
				))}
			</Tabs>

			{erro && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{erro}
				</Alert>
			)}

			{renderConteudo()}
		</Box>
	);
}
