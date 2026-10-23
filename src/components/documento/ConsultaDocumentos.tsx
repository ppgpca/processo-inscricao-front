import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import VisibilityIcon from "@mui/icons-material/Visibility";
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogContent,
	DialogTitle,
	Divider,
	IconButton,
	Paper,
	Snackbar,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { useState } from "react";
import type { ConsultaDocumentosResposta, DocumentoCandidato } from "../../types";
import {
	formatarCpf,
	limparCpf,
	validarCpfDigitos,
} from "../../controllers/cpf-controller";
import { formatarTamanhoArquivo } from "../../controllers/documentos-controller";
import { documentoService } from "../../services/documento.service";

function formatarDataHora(iso: string): string {
	return new Date(iso).toLocaleString("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	});
}

/** Agrupa documentos por tipo, preservando a ordem original (atual primeiro por versão DESC). */
function agruparPorTipo(
	documentos: DocumentoCandidato[],
): Map<number, DocumentoCandidato[]> {
	const mapa = new Map<number, DocumentoCandidato[]>();
	for (const doc of documentos) {
		const lista = mapa.get(doc.idTipoDocumentoEdital) ?? [];
		lista.push(doc);
		mapa.set(doc.idTipoDocumentoEdital, lista);
	}
	return mapa;
}

interface GrupoDocumentoProps {
	cpf: string;
	idInscricao: number;
	documentos: DocumentoCandidato[]; // já ordenados versão DESC
	onErro: (msg: string) => void;
}

function GrupoDocumento({
	cpf,
	idInscricao,
	documentos,
	onErro,
}: GrupoDocumentoProps) {
	const [baixandoVersao, setBaixandoVersao] = useState<number | null>(null);
	const [visualizandoVersao, setVisualizandoVersao] = useState<number | null>(null);
	const [blobUrl, setBlobUrl] = useState<string | null>(null);
	const [dialogOpen, setDialogOpen] = useState(false);
	const [nomeVisualizando, setNomeVisualizando] = useState("");

	const atual = documentos.find((d) => d.atual);
	const anteriores = documentos.filter((d) => !d.atual);
	const nomeTipo = documentos[0]?.nomeTipo ?? "";

	const handleBaixar = async (doc: DocumentoCandidato) => {
		setBaixandoVersao(doc.versao);
		try {
			const blob = await documentoService.baixarConsulta(
				cpf,
				idInscricao,
				doc.idTipoDocumentoEdital,
				doc.versao,
				false,
			);
			const url = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = url;
			link.download = doc.nomeArquivoOriginal;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(url);
		} catch {
			onErro("Não foi possível baixar o arquivo. Tente novamente.");
		} finally {
			setBaixandoVersao(null);
		}
	};

	const handleVisualizar = async (doc: DocumentoCandidato) => {
		setVisualizandoVersao(doc.versao);
		try {
			const blob = await documentoService.baixarConsulta(
				cpf,
				idInscricao,
				doc.idTipoDocumentoEdital,
				doc.versao,
				true,
			);
			// Revoga blob URL anterior para evitar vazamento de memória
			if (blobUrl) URL.revokeObjectURL(blobUrl);
			const url = URL.createObjectURL(blob);
			setBlobUrl(url);
			setNomeVisualizando(doc.nomeArquivoOriginal);
			setDialogOpen(true);
		} catch {
			onErro("Não foi possível visualizar o arquivo. Tente novamente.");
		} finally {
			setVisualizandoVersao(null);
		}
	};

	const fecharDialog = () => {
		setDialogOpen(false);
		if (blobUrl) {
			URL.revokeObjectURL(blobUrl);
			setBlobUrl(null);
		}
	};

	const AcoesDocumento = ({ doc }: { doc: DocumentoCandidato }) => (
		<Box sx={{ display: "flex", gap: 0.5 }}>
			<Tooltip title="Visualizar">
				<span>
					<IconButton
						size="small"
						color="primary"
						disabled={
							baixandoVersao === doc.versao ||
							visualizandoVersao === doc.versao
						}
						onClick={() => handleVisualizar(doc)}
					>
						{visualizandoVersao === doc.versao ? (
							<CircularProgress size={16} />
						) : (
							<VisibilityIcon fontSize="small" />
						)}
					</IconButton>
				</span>
			</Tooltip>
			<Tooltip title="Baixar">
				<span>
					<IconButton
						size="small"
						color="primary"
						disabled={
							baixandoVersao === doc.versao ||
							visualizandoVersao === doc.versao
						}
						onClick={() => handleBaixar(doc)}
					>
						{baixandoVersao === doc.versao ? (
							<CircularProgress size={16} />
						) : (
							<DownloadIcon fontSize="small" />
						)}
					</IconButton>
				</span>
			</Tooltip>
		</Box>
	);

	return (
		<>
			<Paper variant="outlined" sx={{ mb: 1.5 }}>
				{/* Versão atual */}
				{atual ? (
					<Box sx={{ px: 2, py: 1.5 }}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "flex-start",
								gap: 1,
							}}
						>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										flexWrap: "wrap",
										mb: 0.5,
									}}
								>
									<Typography variant="body1" fontWeight={500}>
										{nomeTipo}
									</Typography>
									<Chip
										label="Atual"
										size="small"
										color="success"
										icon={<CheckCircleOutlinedIcon />}
									/>
								</Box>
								<Typography variant="body2" noWrap>
									{atual.nomeArquivoOriginal}
								</Typography>
								<Typography variant="caption" color="text.secondary">
									v{atual.versao} ·{" "}
									{formatarTamanhoArquivo(atual.tamanhoBytes)} ·
									enviado em {formatarDataHora(atual.enviadoEm)}
								</Typography>
							</Box>
							<AcoesDocumento doc={atual} />
						</Box>
					</Box>
				) : (
					<Box sx={{ px: 2, py: 1.5 }}>
						<Typography variant="body1" color="text.secondary">
							{nomeTipo}
						</Typography>
						<Typography variant="caption" color="text.secondary">
							Nenhum documento atual.
						</Typography>
					</Box>
				)}

				{/* Versões anteriores */}
				{anteriores.length > 0 && (
					<>
						<Divider />
						<Accordion
							disableGutters
							elevation={0}
							sx={{
								"&:before": { display: "none" },
								borderRadius: 0,
							}}
						>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon />}
								sx={{ px: 2, py: 0.5, minHeight: 36 }}
							>
								<Typography variant="caption" color="text.secondary">
									{anteriores.length} versã
									{anteriores.length === 1 ? "o anterior" : "ões anteriores"}
								</Typography>
							</AccordionSummary>
							<AccordionDetails sx={{ px: 2, pt: 0, pb: 1 }}>
								{anteriores.map((doc, idx) => (
									<Box key={doc.versao}>
										{idx > 0 && <Divider sx={{ my: 1 }} />}
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "flex-start",
												gap: 1,
											}}
										>
											<Box sx={{ flex: 1, minWidth: 0 }}>
												<Typography variant="body2" noWrap>
													{doc.nomeArquivoOriginal}
												</Typography>
												<Typography
													variant="caption"
													color="text.secondary"
												>
													v{doc.versao} ·{" "}
													{formatarTamanhoArquivo(doc.tamanhoBytes)} ·
													enviado em {formatarDataHora(doc.enviadoEm)}
												</Typography>
											</Box>
											<AcoesDocumento doc={doc} />
										</Box>
									</Box>
								))}
							</AccordionDetails>
						</Accordion>
					</>
				)}
			</Paper>

			{/* Dialog de visualização */}
			<Dialog
				open={dialogOpen}
				onClose={fecharDialog}
				maxWidth="lg"
				fullWidth
			>
				<DialogTitle
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
					}}
				>
					<Typography variant="subtitle1" noWrap sx={{ flex: 1, mr: 2 }}>
						{nomeVisualizando}
					</Typography>
					<Button size="small" onClick={fecharDialog}>
						Fechar
					</Button>
				</DialogTitle>
				<DialogContent sx={{ p: 0, height: "80vh" }}>
					{blobUrl && (
						<iframe
							src={blobUrl}
							title={nomeVisualizando}
							style={{ width: "100%", height: "100%", border: "none" }}
						/>
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}

export default function ConsultaDocumentos() {
	const [cpf, setCpf] = useState("");
	const [numeroInscricao, setNumeroInscricao] = useState("");
	const [buscando, setBuscando] = useState(false);
	const [resultado, setResultado] = useState<ConsultaDocumentosResposta | null>(null);
	const [erroCpf, setErroCpf] = useState<string | null>(null);
	const [erroInscricao, setErroInscricao] = useState<string | null>(null);
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		severity: "error" | "success";
		message: string;
	}>({ open: false, severity: "error", message: "" });

	const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setCpf(formatarCpf(e.target.value));
		setErroCpf(null);
	};

	const handleBuscar = async (e: React.FormEvent) => {
		e.preventDefault();

		const cpfLimpo = limparCpf(cpf);
		const { valido, erro } = validarCpfDigitos(cpfLimpo);
		if (!valido) {
			setErroCpf(erro);
			return;
		}

		const idInscricao = parseInt(numeroInscricao, 10);
		if (!idInscricao || idInscricao <= 0) {
			setErroInscricao("Informe um número de inscrição válido.");
			return;
		}

		setBuscando(true);
		setResultado(null);
		try {
			const dados = await documentoService.consultar(cpfLimpo, idInscricao);
			setResultado(dados);
		} catch {
			setSnackbar({
				open: true,
				severity: "error",
				message:
					"Inscrição não encontrada. Verifique o CPF e o número da inscrição.",
			});
		} finally {
			setBuscando(false);
		}
	};

	const gruposPorTipo = resultado
		? agruparPorTipo(resultado.documentos)
		: null;

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 1 }}>
				Documentos da Inscrição
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				Informe seu CPF e o número da sua inscrição para visualizar os
				documentos enviados.
			</Typography>

			<Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
				<Box
					component="form"
					onSubmit={handleBuscar}
					sx={{ display: "flex", gap: 2, flexWrap: "wrap", alignItems: "flex-start" }}
				>
					<TextField
						label="CPF"
						value={cpf}
						onChange={handleCpfChange}
						error={!!erroCpf}
						helperText={erroCpf}
						inputProps={{ maxLength: 14 }}
						size="small"
						sx={{ flex: "1 1 180px" }}
						required
					/>
					<TextField
						label="Número da inscrição"
						value={numeroInscricao}
						onChange={(e) => {
							setNumeroInscricao(e.target.value.replace(/\D/g, ""));
							setErroInscricao(null);
						}}
						error={!!erroInscricao}
						helperText={erroInscricao}
						inputProps={{ inputMode: "numeric" }}
						size="small"
						sx={{ flex: "1 1 200px" }}
						required
					/>
					<Button
						type="submit"
						variant="contained"
						size="medium"
						disabled={buscando}
						startIcon={buscando ? <CircularProgress size={16} /> : undefined}
						sx={{ mt: 0.5 }}
					>
						{buscando ? "Buscando..." : "Buscar"}
					</Button>
				</Box>
			</Paper>

			{resultado && (
				<Box>
					{/* Resumo da inscrição */}
					<Paper variant="outlined" sx={{ p: 2, mb: 3 }}>
						<Typography variant="subtitle2" color="text.secondary" gutterBottom>
							Inscrição #{resultado.id}
						</Typography>
						<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
							{resultado.linhaPesquisa && (
								<Typography variant="body2">
									Linha de pesquisa: <strong>{resultado.linhaPesquisa}</strong>
								</Typography>
							)}
							<Chip
								label={resultado.finalizada ? "Finalizada" : "Em andamento"}
								color={resultado.finalizada ? "success" : "warning"}
								size="small"
							/>
							{resultado.deferida !== null && (
								<Chip
									label={resultado.deferida ? "Deferida" : "Indeferida"}
									color={resultado.deferida ? "success" : "error"}
									size="small"
								/>
							)}
						</Box>
					</Paper>

					{/* Lista de documentos */}
					{resultado.documentos.length === 0 ? (
						<Alert severity="info">
							Nenhum documento enviado para esta inscrição.
						</Alert>
					) : (
						<>
							<Typography variant="subtitle1" sx={{ mb: 1.5 }}>
								Documentos enviados
							</Typography>
							{gruposPorTipo &&
								Array.from(gruposPorTipo.values()).map((docs) => (
									<GrupoDocumento
										key={docs[0].idTipoDocumentoEdital}
										cpf={limparCpf(cpf)}
										idInscricao={resultado.id}
										documentos={docs}
										onErro={(msg) =>
											setSnackbar({
												open: true,
												severity: "error",
												message: msg,
											})
										}
									/>
								))}
						</>
					)}
				</Box>
			)}

			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
			>
				<Alert
					severity={snackbar.severity}
					onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
}
