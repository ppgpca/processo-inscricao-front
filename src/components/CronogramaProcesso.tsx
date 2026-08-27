import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import HowToRegIcon from "@mui/icons-material/HowToReg";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	LinearProgress,
	Link,
	Paper,
	Typography,
} from "@mui/material";
import type { GridColDef } from "@mui/x-data-grid";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { formatarData } from "../controllers/edital-controller";
import { editalService } from "../services/edital.service";
import { etapaEditalService } from "../services/etapa-edital.service";
import type { Edital, EtapaEdital } from "../types";
import CustomDataGrid from "./customs/CustomDataGrid";

type StatusEtapa = "concluida" | "ativa" | "futura";

function obterStatusEtapa(etapa: EtapaEdital, agora: Date): StatusEtapa {
	if (etapa.dataFim && new Date(etapa.dataFim) < agora) return "concluida";
	if (etapa.dataInicio && new Date(etapa.dataInicio) <= agora) return "ativa";
	return "futura";
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

export default function CronogramaProcesso() {
	const navigate = useNavigate();
	const [edital, setEdital] = useState<Edital | null>(null);
	const [etapas, setEtapas] = useState<EtapaEdital[]>([]);
	const [loading, setLoading] = useState(true);
	const [semEdital, setSemEdital] = useState(false);

	useEffect(() => {
		const carregar = async () => {
			try {
				let ed = await editalService.findVigente();
				if (!ed) {
					ed = await editalService.findProximo().catch(() => null);
				}
				if (!ed) {
					setSemEdital(true);
					return;
				}
				setEdital(ed);

				let lista: EtapaEdital[] = ed.etapas ?? [];
				if (lista.length === 0) {
					lista = await etapaEditalService
						.findByEdital(ed.id)
						.catch(() => []);
				}
				setEtapas([...lista].sort((a, b) => a.ordem - b.ordem));
			} catch {
				setSemEdital(true);
			} finally {
				setLoading(false);
			}
		};
		carregar();
	}, []);

	const agora = new Date();

	const inscricaoAtiva = useMemo(
		() =>
			etapas.some(
				(e) =>
					e.nome === "INSCRICAO" &&
					e.dataInicio &&
					new Date(e.dataInicio) <= agora &&
					e.dataFim &&
					new Date(e.dataFim) >= agora,
			),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[etapas],
	);

	const rows = useMemo(
		() =>
			etapas.map((etapa) => ({
				...etapa,
				status: obterStatusEtapa(etapa, agora),
			})),
		// eslint-disable-next-line react-hooks/exhaustive-deps
		[etapas],
	);

	const colunas = useMemo<GridColDef[]>(
		() => [
			{
				field: "ordem",
				headerName: "#",
				width: 60,
				type: "number",
				headerAlign: "center",
				align: "center",
			},
			{
				field: "descricao",
				headerName: "Etapa",
				flex: 1,
				minWidth: 180,
			},
			{
				field: "dataInicio",
				headerName: "Início",
				width: 120,
				renderCell: (params) => (
					<Typography variant="body2">
						{params.value
							? formatarData(params.value as string)
							: "—"}
					</Typography>
				),
			},
			{
				field: "dataFim",
				headerName: "Fim",
				width: 120,
				renderCell: (params) => (
					<Typography variant="body2">
						{params.value
							? formatarData(params.value as string)
							: "—"}
					</Typography>
				),
			},
			{
				field: "status",
				headerName: "Status",
				width: 150,
				sortable: false,
				filterable: false,
				renderCell: (params) => (
					<ChipStatusEtapa status={params.value as StatusEtapa} />
				),
			},
		],
		[],
	);

	if (loading) {
		return (
			<Box sx={{ width: "100%" }}>
				<LinearProgress />
				<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
					<CircularProgress />
				</Box>
			</Box>
		);
	}

	if (semEdital) {
		return (
			<Box
				sx={{
					display: "flex",
					justifyContent: "center",
					alignItems: "center",
					minHeight: "60vh",
				}}
			>
				<Paper
					variant="outlined"
					sx={{
						p: { xs: 4, md: 6 },
						maxWidth: 480,
						width: "100%",
						textAlign: "center",
						borderRadius: 3,
					}}
				>
					<Chip
						label="Em breve"
						color="primary"
						sx={{ mb: 3, fontWeight: 600 }}
					/>
					<Typography
						variant="h4"
						sx={{ fontWeight: 700 }}
						color="primary.main"
						gutterBottom
					>
						Site em construção
					</Typography>
					<Typography variant="body1" color="text.secondary">
						Estamos preparando a plataforma de inscrições do
						Processo Seletivo PPGPCA da UFFS. Em breve você poderá
						realizar sua inscrição por aqui.
					</Typography>
					<Divider sx={{ my: 3 }} />
					<Typography variant="caption" color="text.secondary">
						Universidade Federal da Fronteira Sul — UFFS
					</Typography>
				</Paper>
			</Box>
		);
	}

	return (
		<Box sx={{ width: "100%" }}>
			{edital && (
				<Alert severity="info" sx={{ mb: 2 }}>
					<strong>{edital.titulo}</strong> —{" "}
					{edital.urlEditalPdf ? (
						<Link
							href={edital.urlEditalPdf}
							target="_blank"
							rel="noopener noreferrer"
							sx={{
								fontWeight: 700,
								color: "#f5c842",
								"&:hover": { color: "#ffe680" },
							}}
						>
							Edital nº {edital.numero} ({edital.ano})
						</Link>
					) : (
						<>
							Edital nº {edital.numero} ({edital.ano})
						</>
					)}
				</Alert>
			)}

			{inscricaoAtiva && (
				<Box sx={{ mb: 2, display: "flex", justifyContent: "flex-end" }}>
					<Button
						variant="contained"
						color="primary"
						startIcon={<HowToRegIcon />}
						onClick={() => navigate("/inscricoes")}
					>
						Fazer Inscrição
					</Button>
				</Box>
			)}

			<Paper sx={{ p: 2 }}>
				<Box
					sx={{
						display: "flex",
						alignItems: "center",
						gap: 1,
						mb: 2,
					}}
				>
					<CalendarMonthIcon color="primary" />
					<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
						Cronograma do Processo Seletivo
					</Typography>
					{etapas.length > 0 && (
						<Chip
							label={`${etapas.length} etapa${etapas.length !== 1 ? "s" : ""}`}
							size="small"
							color="primary"
							variant="outlined"
						/>
					)}
				</Box>

			{etapas.length === 0 ? (
				<Typography variant="body2" color="text.secondary">
					Nenhuma etapa configurada para este processo seletivo.
				</Typography>
			) : (
				<CustomDataGrid
					rows={rows}
					columns={colunas}
					pageSize={25}
					getRowId={(row) => row.id}
					hideFooter
					autoHeight
				/>
			)}
			</Paper>
		</Box>
	);
}
