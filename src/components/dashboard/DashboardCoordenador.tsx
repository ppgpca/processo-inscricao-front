import { Box, CircularProgress, Grid, Typography } from "@mui/material";
import { useDashboard } from "../../hooks/useDashboard";
import GraficoInscricoesPorDia from "./GraficoInscricoesPorDia";
import GraficoInscritosPorLinhaPesquisa from "./GraficoInscritosPorLinhaPesquisa";
import ListaInscritos from "./ListaInscritos";

interface Props {
	idEdital?: number;
}

export default function DashboardCoordenador({ idEdital }: Props) {
	const { dados, loading, erro } = useDashboard(idEdital);

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (erro) {
		return (
			<Box sx={{ mt: 4 }}>
				<Typography color="error">{erro}</Typography>
			</Box>
		);
	}

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 3 }}>
				Dashboard
			</Typography>

			<Grid container spacing={2}>
				<Grid size={{ xs: 12, md: 7 }}>
					<GraficoInscricoesPorDia
						dados={dados?.inscricoesPorDia ?? []}
					/>
				</Grid>
				<Grid size={{ xs: 12, md: 5 }}>
					<GraficoInscritosPorLinhaPesquisa
						dados={dados?.inscritosPorLinhaPesquisa ?? []}
					/>
				</Grid>
			</Grid>

			<Box sx={{ mt: 3 }}>
				<ListaInscritos dados={dados?.inscritos ?? []} />
			</Box>
		</Box>
	);
}
