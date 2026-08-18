import { useState } from "react";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DownloadIcon from "@mui/icons-material/Download";
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
import type { DocumentoRecurso, RecursoGestaoRow } from "../../../types";
import { formatarTamanhoArquivo } from "../../../controllers/documentos-controller";
import { recursoService } from "../../../services/recurso.service";

function mascaraCpf(cpf: string): string {
	if (!cpf) return "";
	const limpo = cpf.replace(/\D/g, "");
	if (limpo.length !== 11) return cpf;
	return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 8)}*-**`;
}

interface Props {
	recurso: RecursoGestaoRow;
	somenteLeitura?: boolean;
	onVoltar: () => void;
	onSalvo: (recursoAtualizado: RecursoGestaoRow) => void;
}

export default function DecisaoRecurso({
	recurso,
	somenteLeitura = false,
	onVoltar,
	onSalvo,
}: Props) {
	const theme = useTheme();
	const [deferido, setDeferido] = useState<boolean | null>(recurso.deferido);
	const [comentario, setComentario] = useState(recurso.comentario ?? "");
	const [salvando, setSalvando] = useState(false);
	const [baixandoPorTipo, setBaixandoPorTipo] = useState<
		Record<number, boolean>
	>({});
	const [erro, setErro] = useState<string | null>(null);

	const formValido = deferido !== null && comentario.trim() !== "";
	const documentos = recurso.documentos ?? [];

	const handleBaixarDocumento = async (documento: DocumentoRecurso) => {
		if (baixandoPorTipo[documento.idTipoDocumentoEdital]) return;
		setBaixandoPorTipo((prev) => ({
			...prev,
			[documento.idTipoDocumentoEdital]: true,
		}));
		setErro(null);
		try {
			const url = recursoService.getDownloadUrl(
				recurso.idInscricao,
				documento.idTipoDocumentoEdital,
			);
			const response = await fetch(url);
			if (!response.ok) throw new Error("Falha ao baixar");
			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = objectUrl;
			link.download = documento.nomeArquivoOriginal;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
		} catch {
			setErro("Não foi possível baixar o documento do recurso.");
		} finally {
			setBaixandoPorTipo((prev) => ({
				...prev,
				[documento.idTipoDocumentoEdital]: false,
			}));
		}
	};

	const handleSalvar = async () => {
		if (somenteLeitura || !formValido || salvando) return;
		setSalvando(true);
		setErro(null);
		try {
			const atualizado = await recursoService.decidir(recurso.id, {
				deferido: deferido as boolean,
				comentario: comentario.trim(),
			});
			onSalvo({ ...recurso, ...atualizado });
		} catch (e) {
			const msg = (
				e as { response?: { data?: { message?: string | string[] } } }
			)?.response?.data?.message;
			const texto = Array.isArray(msg) ? msg.join(" ") : msg;
			setErro(texto ?? "Erro ao salvar a decisão. Tente novamente.");
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
				{!somenteLeitura && (
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
				)}
			</Box>

			{somenteLeitura && (
				<Alert severity="info" sx={{ mb: 2 }}>
					O prazo de envio ainda está aberto. Você pode visualizar o recurso e
					baixar os documentos; a decisão e a remoção ficam disponíveis após o
					término do prazo.
				</Alert>
			)}

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

					<Divider sx={{ my: 2 }} />

					<Typography variant="subtitle2" color="text.secondary" gutterBottom>
						Documentos do recurso
					</Typography>
					{documentos.length > 0 ? (
						documentos.map((documento) => {
							const baixando =
								baixandoPorTipo[documento.idTipoDocumentoEdital] ?? false;
							return (
								<Box
									key={documento.idTipoDocumentoEdital}
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										gap: 1,
										flexWrap: "wrap",
										mb: 1.5,
									}}
								>
									<Box>
										<Typography variant="body2" fontWeight={500}>
											{documento.label}
										</Typography>
										<Typography variant="body2">
											{documento.nomeArquivoOriginal}
										</Typography>
										<Typography variant="caption" color="text.secondary">
											v{documento.versao} ·{" "}
											{formatarTamanhoArquivo(documento.tamanhoBytes)}
										</Typography>
									</Box>
									<Button
										size="small"
										startIcon={
											baixando ? (
												<CircularProgress size={14} />
											) : (
												<DownloadIcon />
											)
										}
										onClick={() => handleBaixarDocumento(documento)}
										disabled={baixando}
									>
										Baixar
									</Button>
								</Box>
							);
						})
					) : (
						<Typography variant="body2" color="text.secondary">
							Nenhum documento anexado.
						</Typography>
					)}
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
							if (somenteLeitura) return;
							if (valor !== null) setDeferido(valor);
						}}
						sx={{ mb: 2 }}
					>
						<ToggleButton value={true} color="success" disabled={somenteLeitura}>
							Deferido
						</ToggleButton>
						<ToggleButton value={false} color="error" disabled={somenteLeitura}>
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
						disabled={somenteLeitura}
						helperText={
							somenteLeitura
								? "Disponível para edição após o término do prazo."
								: "Obrigatório para salvar a decisão."
						}
					/>
				</CardContent>
			</Card>
		</Box>
	);
}
