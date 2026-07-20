import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Badge,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	IconButton,
	Snackbar,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import EditIcon from "@mui/icons-material/Edit";
import SyncIcon from "@mui/icons-material/Sync";
import type { GridColDef } from "@mui/x-data-grid";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import CustomDataGrid from "../../customs/CustomDataGrid";
import { useDistribuicaoAnteprojeto } from "../../../hooks/useDistribuicaoAnteprojeto";
import type {
	AppMessage,
	CandidatoDistribuicao,
	DocenteAtribuido,
} from "../../../types";
import MenuAtribuicaoDocentes from "./MenuAtribuicaoDocentes";

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

interface SecaoAnteprojetoProps {
	idEdital: number | "";
}

export default function SecaoAnteprojeto({ idEdital }: SecaoAnteprojetoProps) {
	const theme = useTheme();
	const {
		candidatos,
		docentes,
		loading,
		erro,
		distribuindo,
		sincronizando,
		proporDistribuicaoAutomatica,
		sincronizarAtribuicoes,
	} = useDistribuicaoAnteprojeto(idEdital);

	const [atribuicaoLocal, setAtribuicaoLocal] = useState<
		Record<number, string[]>
	>({});
	const [message, setMessage] = useState<AppMessage | null>(null);
	const [menuAncora, setMenuAncora] = useState<HTMLElement | null>(null);
	const [candidatoSelecionado, setCandidatoSelecionado] =
		useState<CandidatoDistribuicao | null>(null);
	const [falhas, setFalhas] = useState<
		{ idInscricao: number; motivo: string }[]
	>([]);

	const contadorPendentes = Object.keys(atribuicaoLocal).length;

	useEffect(() => {
		setAtribuicaoLocal({});
		setFalhas([]);
	}, [idEdital]);

	const docentesEfetivos = (
		candidato: CandidatoDistribuicao,
	): DocenteAtribuido[] => {
		const pendente = atribuicaoLocal[candidato.idInscricao];
		if (!pendente) return candidato.docentesAtribuidos;

		const porCodigo = new Map(
			candidato.docentesAtribuidos.map((d) => [d.codigoDocente, d]),
		);
		return pendente.map((codigo) => {
			const existente = porCodigo.get(codigo);
			if (existente) return existente;
			return {
				codigoDocente: codigo,
				nome: docentes.find((d) => d.codigo === codigo)?.nome ?? codigo,
				temNotaLancada: false,
			};
		});
	};

	const abrirMenu = (
		event: React.MouseEvent<HTMLElement>,
		candidato: CandidatoDistribuicao,
	) => {
		setMenuAncora(event.currentTarget);
		setCandidatoSelecionado({
			...candidato,
			docentesAtribuidos: docentesEfetivos(candidato),
		});
	};

	const fecharMenu = () => {
		setMenuAncora(null);
		setCandidatoSelecionado(null);
	};

	const handleAplicarAtribuicao = (codigosDocentes: string[]) => {
		if (!candidatoSelecionado) return;
		const idInscricao = candidatoSelecionado.idInscricao;
		const atual = candidatos.find((c) => c.idInscricao === idInscricao);
		const originais = (atual?.docentesAtribuidos ?? []).map(
			(d) => d.codigoDocente,
		);
		const mesmoConteudo =
			originais.length === codigosDocentes.length &&
			originais.every((c) => codigosDocentes.includes(c));

		setAtribuicaoLocal((prev) => {
			const next = { ...prev };
			if (mesmoConteudo) {
				delete next[idInscricao];
			} else {
				next[idInscricao] = codigosDocentes;
			}
			return next;
		});
		fecharMenu();
	};

	const handleDistribuirAutomaticamente = async () => {
		const proposta = await proporDistribuicaoAutomatica();
		if (!proposta) return;

		if (proposta.length === 0) {
			setMessage({
				text: "Nenhuma atribuição nova a propor — todos já estão completos.",
				severity: "info",
			});
			return;
		}

		setAtribuicaoLocal((prev) => {
			const next = { ...prev };
			for (const item of proposta) {
				next[item.idInscricao] = item.codigosDocentes;
			}
			return next;
		});
		setMessage({
			text: `Proposta local: ${proposta.length} candidato(s). Clique em Sincronizar para gravar.`,
			severity: "info",
		});
	};

	const handleSincronizar = async () => {
		const itens = Object.entries(atribuicaoLocal).map(
			([idInscricao, codigosDocentes]) => ({
				idInscricao: Number(idInscricao),
				codigosDocentes,
			}),
		);
		const resultado = await sincronizarAtribuicoes(itens);
		if (!resultado) return;

		setFalhas(resultado.falhas);
		if (resultado.falhas.length === 0) {
			setAtribuicaoLocal({});
			setMessage({
				text: `${resultado.sucesso.length} atribuição(ões) sincronizada(s) com sucesso.`,
				severity: "success",
			});
		} else {
			const idsComFalha = new Set(resultado.falhas.map((f) => f.idInscricao));
			setAtribuicaoLocal((prev) => {
				const next: Record<number, string[]> = {};
				for (const [id, codigos] of Object.entries(prev)) {
					if (idsComFalha.has(Number(id))) next[Number(id)] = codigos;
				}
				return next;
			});
			setMessage({
				text: `${resultado.sucesso.length} sincronizada(s), ${resultado.falhas.length} com pendência.`,
				severity: "warning",
			});
		}
	};

	const colunas = useMemo<GridColDef[]>(
		() => [
			{
				field: "cpf",
				headerName: "CPF",
				width: 140,
				renderCell: (params) => (
					<span style={{ fontFamily: "monospace", fontSize: 13 }}>
						{mascaraCpf(params.value as string)}
					</span>
				),
			},
			{ field: "nome", headerName: "Candidato", flex: 1, minWidth: 180 },
			{
				field: "linhaPesquisa",
				headerName: "Linha de pesquisa",
				width: 180,
			},
			{
				field: "palavrasChave",
				headerName: "Palavras-chave",
				flex: 1,
				minWidth: 200,
				sortable: false,
				renderCell: (params) => {
					const palavras: string[] = params.value ?? [];
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
				field: "docentesAtribuidos",
				headerName: "Avaliadores",
				flex: 1,
				minWidth: 220,
				sortable: false,
				renderCell: (params) => {
					const row = params.row as CandidatoDistribuicao;
					const pendente = row.idInscricao in atribuicaoLocal;
					const lista = docentesEfetivos(row);
					return (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								flexWrap: "wrap",
								py: 0.5,
							}}
						>
							{lista.length === 0 ? (
								<Typography
									variant="body2"
									color="text.disabled"
									sx={{ fontStyle: "italic" }}
								>
									Nenhum atribuído
								</Typography>
							) : (
								lista.map((d) => (
									<Chip
										key={d.codigoDocente}
										label={d.nome}
										size="small"
										color={
											d.temNotaLancada
												? "success"
												: pendente
													? "warning"
													: "default"
										}
									/>
								))
							)}
							<Tooltip title="Editar avaliadores">
								<IconButton size="small" onClick={(e) => abrirMenu(e, row)}>
									<EditIcon fontSize="small" />
								</IconButton>
							</Tooltip>
						</Box>
					);
				},
			},
		],
		[atribuicaoLocal, docentes],
	);

	const rows = candidatos.map((c) => ({ id: c.idInscricao, ...c }));

	return (
		<Box>
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

			{loading ? (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
					<CircularProgress />
				</Box>
			) : (
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
									Candidatos homologados
								</Typography>
								<Chip
									label={`${candidatos.length} candidato${candidatos.length !== 1 ? "s" : ""}`}
									size="small"
									color="primary"
									variant="outlined"
								/>
								<Chip
									label={`${docentes.length} docente${docentes.length !== 1 ? "s" : ""} avaliador(es)`}
									size="small"
									variant="outlined"
								/>
							</Box>

							<Stack direction="row" spacing={1}>
								<Button
									variant="outlined"
									size="small"
									startIcon={
										distribuindo ? (
											<CircularProgress size={14} color="inherit" />
										) : (
											<ShuffleIcon />
										)
									}
									onClick={handleDistribuirAutomaticamente}
									disabled={distribuindo || candidatos.length === 0}
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
												onClick={handleSincronizar}
												disabled={contadorPendentes === 0 || sincronizando}
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
			)}

			<MenuAtribuicaoDocentes
				anchorEl={menuAncora}
				candidato={candidatoSelecionado}
				docentesDisponiveis={docentes}
				onClose={fecharMenu}
				onAplicar={handleAplicarAtribuicao}
			/>

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
