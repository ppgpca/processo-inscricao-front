import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import TripOriginIcon from "@mui/icons-material/TripOrigin";
import {
	Box,
	Chip,
	Collapse,
	Divider,
	Paper,
	Tooltip,
	Typography,
} from "@mui/material";
import { useState } from "react";
import type { EtapaEdital } from "../types";
import { formatarData } from "../controllers/edital-controller";

interface ProcessoTimelineProps {
	etapas: EtapaEdital[];
}

function obterStatusEtapa(
	etapa: EtapaEdital,
	agora: Date,
): "concluida" | "ativa" | "futura" {
	if (etapa.dataFim && new Date(etapa.dataFim) < agora) return "concluida";
	if (etapa.dataInicio && new Date(etapa.dataInicio) <= agora) return "ativa";
	return "futura";
}

export default function ProcessoTimeline({ etapas }: ProcessoTimelineProps) {
	const [expandida, setExpandida] = useState(false);

	if (!etapas || etapas.length === 0) return null;

	const agora = new Date();
	const etapasOrdenadas = [...etapas].sort((a, b) => a.ordem - b.ordem);

	const etapaAtiva = etapasOrdenadas.find(
		(e) => obterStatusEtapa(e, agora) === "ativa",
	);

	return (
		<Paper variant="outlined" sx={{ mb: 2, overflow: "hidden" }}>
			<Box
				sx={{
					px: 2,
					py: 1.5,
					display: "flex",
					alignItems: "center",
					gap: 1,
					cursor: "pointer",
					userSelect: "none",
				}}
				onClick={() => setExpandida((v) => !v)}
			>
				<Typography variant="subtitle2" sx={{ fontWeight: 600, flexGrow: 1 }}>
					Fluxo do processo seletivo
				</Typography>

				{etapaAtiva && (
					<Chip
						label={etapaAtiva.nome}
						color="primary"
						size="small"
						icon={<TripOriginIcon />}
						sx={{ fontWeight: 600 }}
					/>
				)}

				<Typography variant="caption" color="text.secondary">
					{expandida ? "Ocultar" : "Ver todas"}
				</Typography>
			</Box>

			<Collapse in={expandida}>
				<Divider />
				<Box sx={{ px: 2, py: 2 }}>
					{etapasOrdenadas.map((etapa, index) => {
						const status = obterStatusEtapa(etapa, agora);
						const isLast = index === etapasOrdenadas.length - 1;

						return (
							<Box key={etapa.id} sx={{ display: "flex", gap: 1.5 }}>
								<Box
									sx={{
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
									}}
								>
									<Tooltip
										title={
											status === "concluida"
												? "Concluída"
												: status === "ativa"
													? "Em andamento"
													: "Aguardando"
										}
									>
										{status === "concluida" ? (
											<CheckCircleIcon
												sx={{ fontSize: 20 }}
												color="success"
											/>
										) : status === "ativa" ? (
											<TripOriginIcon
												sx={{ fontSize: 20 }}
												color="primary"
											/>
										) : (
											<RadioButtonUncheckedIcon
												sx={{ fontSize: 20 }}
												color="disabled"
											/>
										)}
									</Tooltip>
									{!isLast && (
										<Box
											sx={{
												width: 2,
												flexGrow: 1,
												minHeight: 16,
												bgcolor:
													status === "concluida"
														? "success.main"
														: "divider",
												my: 0.5,
											}}
										/>
									)}
								</Box>

								<Box sx={{ pb: isLast ? 0 : 1.5 }}>
									<Typography
										variant="body2"
										sx={{
											fontWeight:
												status === "ativa" ? 700 : 400,
											color:
												status === "futura"
													? "text.disabled"
													: "text.primary",
										}}
									>
										{etapa.nome}
									</Typography>

									{(etapa.dataInicio || etapa.dataFim) && (
										<Typography
											variant="caption"
											color="text.secondary"
										>
											{etapa.dataInicio
												? formatarData(etapa.dataInicio)
												: "—"}{" "}
											→{" "}
											{etapa.dataFim
												? formatarData(etapa.dataFim)
												: "—"}
										</Typography>
									)}
								</Box>
							</Box>
						);
					})}
				</Box>
			</Collapse>
		</Paper>
	);
}
