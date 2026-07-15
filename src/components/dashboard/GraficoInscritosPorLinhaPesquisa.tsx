import { useTheme } from "@mui/material/styles";
import { Box, Card, CardContent, Typography } from "@mui/material";
import {
	ResponsiveContainer,
	BarChart,
	Bar,
	XAxis,
	YAxis,
	Tooltip,
	CartesianGrid,
	Cell,
} from "recharts";
import type { InscritoPorLinhaPesquisa } from "../../types";

interface Props {
	dados: InscritoPorLinhaPesquisa[];
}

export default function GraficoInscritosPorLinhaPesquisa({ dados }: Props) {
	const theme = useTheme();

	const alturaGrafico = Math.max(200, dados.length * 52);

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
					Inscritos por linha de pesquisa
				</Typography>
				<Box sx={{ minHeight: 200 }}>
					{dados && dados.length > 0 ? (
						<ResponsiveContainer
							width="100%"
							height={alturaGrafico}
						>
							<BarChart
								data={dados}
								layout="vertical"
								margin={{
									top: 8,
									right: 20,
									left: 4,
									bottom: 8,
								}}
								barCategoryGap="20%"
							>
								<CartesianGrid
									strokeDasharray="3 3"
									stroke={theme.palette.divider}
								/>
								<XAxis
									type="number"
									allowDecimals={false}
									tick={{
										fill: theme.palette.text.secondary,
										fontSize: 11,
									}}
									axisLine={{ stroke: theme.palette.divider }}
									tickLine={{ stroke: theme.palette.divider }}
								/>
								<YAxis
									type="category"
									dataKey="linhaPesquisa"
									width={160}
									tick={{
										fill: theme.palette.text.secondary,
										fontSize: 11,
									}}
									axisLine={{ stroke: theme.palette.divider }}
									tickLine={{ stroke: theme.palette.divider }}
									tickFormatter={(v: string) =>
										v.length > 22 ? `${v.slice(0, 22)}…` : v
									}
								/>
								<Tooltip
									wrapperStyle={{ outline: "none" }}
									contentStyle={{
										backgroundColor:
											theme.palette.background.paper,
										border: `1px solid ${theme.palette.divider}`,
										color: theme.palette.text.primary,
									}}
									labelStyle={{
										color: theme.palette.text.secondary,
									}}
									itemStyle={{
										color: theme.palette.text.primary,
									}}
								/>
								<Bar
									dataKey="quantidade"
									name="Inscritos"
									radius={[0, 4, 4, 0]}
								>
									{dados.map((_, index) => (
										<Cell
											key={index}
											fill={
												index % 2 === 0
													? theme.palette.primary.main
													: theme.palette.secondary
															.main
											}
										/>
									))}
								</Bar>
							</BarChart>
						</ResponsiveContainer>
					) : (
						<Box sx={{ p: 2 }}>
							<Typography variant="body2" color="text.secondary">
								Nenhum dado disponível
							</Typography>
						</Box>
					)}
				</Box>
			</CardContent>
		</Card>
	);
}
