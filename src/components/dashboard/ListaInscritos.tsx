import { useTheme } from "@mui/material/styles";
import {
	Box,
	Card,
	CardContent,
	Chip,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	Typography,
} from "@mui/material";
import { useState } from "react";
import type { InscritoDashboard } from "../../types";

interface Props {
	dados: InscritoDashboard[];
}

function mascaraCpf(cpf: string): string {
	if (!cpf) return "";
	const limpo = cpf.replace(/\D/g, "");
	if (limpo.length !== 11) return cpf;
	return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 9)}-**`;
}

export default function ListaInscritos({ dados }: Props) {
	const theme = useTheme();
	const [pagina, setPagina] = useState(0);
	const [linhasPorPagina, setLinhasPorPagina] = useState(10);

	const paginados = dados.slice(
		pagina * linhasPorPagina,
		pagina * linhasPorPagina + linhasPorPagina,
	);

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
						justifyContent: "space-between",
						mb: 1,
					}}
				>
					<Typography variant="subtitle1">Lista de inscritos</Typography>
					<Chip
						label={`${dados.length} inscri${dados.length !== 1 ? "ções" : "ção"}`}
						size="small"
						color="primary"
						variant="outlined"
					/>
				</Box>

				{dados.length === 0 ? (
					<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
						Nenhum inscrito encontrado
					</Typography>
				) : (
					<>
						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell
											sx={{
												fontWeight: 600,
												color: theme.palette.text.secondary,
												fontSize: 12,
											}}
										>
											CPF
										</TableCell>
										<TableCell
											sx={{
												fontWeight: 600,
												color: theme.palette.text.secondary,
												fontSize: 12,
											}}
										>
											Linha de pesquisa
										</TableCell>
										<TableCell
											sx={{
												fontWeight: 600,
												color: theme.palette.text.secondary,
												fontSize: 12,
											}}
										>
											Título do anteprojeto
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{paginados.map((inscrito, index) => (
										<TableRow
											key={index}
											sx={{
												"&:hover": {
													backgroundColor: theme.palette.action.hover,
												},
											}}
										>
											<TableCell
												sx={{
													fontFamily: "monospace",
													fontSize: 13,
													whiteSpace: "nowrap",
												}}
											>
												{mascaraCpf(inscrito.cpf)}
											</TableCell>
											<TableCell sx={{ fontSize: 13 }}>
												{inscrito.linhaPesquisa || (
													<Typography
														component="span"
														variant="body2"
														color="text.disabled"
														fontStyle="italic"
													>
														Não informada
													</Typography>
												)}
											</TableCell>
											<TableCell
												sx={{
													fontSize: 13,
													maxWidth: 400,
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{inscrito.anteprojeto || (
													<Typography
														component="span"
														variant="body2"
														color="text.disabled"
														fontStyle="italic"
													>
														Não informado
													</Typography>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
						<TablePagination
							component="div"
							count={dados.length}
							page={pagina}
							onPageChange={(_, novaPagina) => setPagina(novaPagina)}
							rowsPerPage={linhasPorPagina}
							onRowsPerPageChange={(e) => {
								setLinhasPorPagina(Number(e.target.value));
								setPagina(0);
							}}
							rowsPerPageOptions={[5, 10, 25]}
							labelRowsPerPage="Linhas por página:"
							labelDisplayedRows={({ from, to, count }) =>
								`${from}–${to} de ${count}`
							}
							sx={{ borderTop: `1px solid ${theme.palette.divider}`, mt: 1 }}
						/>
					</>
				)}
			</CardContent>
		</Card>
	);
}
