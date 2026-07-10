import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography } from "@mui/material";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
} from "recharts";
import type { InscricaoPorDia } from "../../types";

interface Props {
	dados: InscricaoPorDia[];
}

function formatarData(valor: string) {
	if (!valor) return valor;
	const [ano, mes, dia] = String(valor).split("-");
	return `${dia}/${mes}`;
}

function formatarDataCompleta(valor: string) {
	if (!valor) return valor;
	const [ano, mes, dia] = String(valor).split("-");
	return `${dia}/${mes}/${ano}`;
}

export default function GraficoInscricoesPorDia({ dados }: Props) {
	const theme = useTheme();

	return (
		<Card
			sx={{
				backgroundColor: theme.palette.background.default,
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<CardContent>
				<Typography variant="subtitle1" gutterBottom>
					Inscrições por dia
				</Typography>
				<Box sx={{ minHeight: 300 }}>
					{dados && dados.length > 0 ? (
						<ResponsiveContainer width="100%" height={300}>
							<LineChart
								data={dados}
								margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke={theme.palette.divider}
								/>
								<XAxis
									dataKey="data"
									tick={{
										fill: theme.palette.text.secondary,
										fontSize: 11,
									}}
									axisLine={{ stroke: theme.palette.divider }}
									tickLine={{ stroke: theme.palette.divider }}
									tickFormatter={formatarData}
								/>
								<YAxis
									allowDecimals={false}
									tick={{
										fill: theme.palette.text.secondary,
										fontSize: 11,
									}}
									axisLine={{ stroke: theme.palette.divider }}
									tickLine={{ stroke: theme.palette.divider }}
								/>
								<Tooltip
									wrapperStyle={{ outline: "none" }}
									contentStyle={{
										backgroundColor: theme.palette.background.paper,
										border: `1px solid ${theme.palette.divider}`,
										color: theme.palette.text.primary,
									}}
									labelStyle={{ color: theme.palette.text.secondary }}
									itemStyle={{ color: theme.palette.text.primary }}
									labelFormatter={formatarDataCompleta}
								/>
								<Line
									type="monotone"
									dataKey="quantidade"
									name="Inscrições"
									stroke={theme.palette.primary.main}
									strokeWidth={2}
									dot={{ r: 3, fill: theme.palette.primary.main }}
									activeDot={{ r: 5 }}
								/>
							</LineChart>
						</ResponsiveContainer>
					) : (
						<Box sx={{ p: 2 }}>
							<Typography variant="body2" color="text.secondary">
								Nenhuma inscrição registrada ainda
							</Typography>
						</Box>
					)}
				</Box>
			</CardContent>
		</Card>
	);
}
