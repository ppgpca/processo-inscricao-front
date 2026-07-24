import { useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Divider,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { RecursoGestaoRow } from "../../../types";
import { recursoService } from "../../../services/recurso.service";

function mascaraCpf(cpf: string): string {
	if (!cpf) return "";
	const limpo = cpf.replace(/\D/g, "");
	if (limpo.length !== 11) return cpf;
	return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 8)}*-**`;
}

interface Props {
	recurso: RecursoGestaoRow;
	onVoltar: () => void;
	onSalvo: (recursoAtualizado: RecursoGestaoRow) => void;
}

export default function DecisaoRecurso({ recurso, onVoltar, onSalvo }: Props) {
	const theme = useTheme();
	const [deferido, setDeferido] = useState<boolean | null>(recurso.deferido);
	const [comentario, setComentario] = useState(recurso.comentario ?? "");
	const [salvando, setSalvando] = useState(false);
	const [erro, setErro] = useState<string | null>(null);

	const formValido = deferido !== null && comentario.trim() !== "";

	const handleSalvar = async () => {
		if (!formValido || salvando) return;
		setSalvando(true);
		setErro(null);
		try {
			const atualizado = await recursoService.decidir(recurso.id, {
				deferido: deferido as boolean,
				comentario: comentario.trim(),
			});
			onSalvo({ ...recurso, ...atualizado });
		} catch {
			setErro("Erro ao salvar a decisão. Tente novamente.");
		} finally {
			setSalvando(false);
		}
	};

	return (
		<Box>
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
				<Button startIcon={<ArrowBackIcon />} onClick={onVoltar} variant="text">
					Voltar
				</Button>
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
					disabled={!formValido || salvando}
				>
					{salvando ? "Salvando…" : "Salvar"}
				</Button>
			</Box>

			<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 3 }}>
				<Typography variant="body1" sx={{ fontFamily: "monospace" }}>
					{mascaraCpf(recurso.candidatoCpf)}
				</Typography>
				<Typography variant="body1" color="text.secondary">
					— {recurso.candidatoNome}
				</Typography>
			</Box>

			<Card sx={{ mb: 3, backgroundColor: theme.palette.background.default }}>
				<CardContent>
					<Typography variant="subtitle2" color="text.secondary" gutterBottom>
						Argumentação do candidato
					</Typography>
					<Typography variant="body2" sx={{ whiteSpace: "pre-wrap" }}>
						{recurso.texto}
					</Typography>
				</CardContent>
			</Card>

			{erro && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{erro}
				</Alert>
			)}

			<Card sx={{ backgroundColor: theme.palette.background.default }}>
				<CardContent>
					<Typography variant="subtitle2" gutterBottom>
						Decisão
					</Typography>
					<ToggleButtonGroup
						exclusive
						value={deferido}
						onChange={(_, valor) => {
							if (valor !== null) setDeferido(valor);
						}}
						sx={{ mb: 2 }}
					>
						<ToggleButton value={true} color="success">
							Deferido
						</ToggleButton>
						<ToggleButton value={false} color="error">
							Indeferido
						</ToggleButton>
					</ToggleButtonGroup>

					<Divider sx={{ mb: 2 }} />

					<TextField
						fullWidth
						multiline
						minRows={4}
						label="Comentário"
						value={comentario}
						onChange={(e) => setComentario(e.target.value)}
						helperText="Obrigatório para salvar a decisão."
					/>
				</CardContent>
			</Card>
		</Box>
	);
}
