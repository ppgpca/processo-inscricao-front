import CheckCircleIcon from "@mui/icons-material/CheckCircle";
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
	Snackbar,
	Step,
	StepLabel,
	Stepper,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { Documento, Edital, TipoDocumentoEdital } from "../types";
import { useInscricao } from "../hooks/useInscricao";
import { editalService } from "../services/edital.service";
import {
	STEPS,
	validarEtapaAtual,
	obterTextoBotaoProximo,
} from "../controllers/inscricao-controller";
import { formatarData, obterDataFimInscricao, obterDataInicioInscricao } from "../controllers/edital-controller";
import { todosObrigatoriosEnviados as calcTodosObrigatoriosEnviados } from "../controllers/documentos-controller";
import EtapaCpf from "./inscricao/EtapaCpf";
import EtapaDadosPessoais from "./inscricao/EtapaDadosPessoais";
import EtapaDocumentos from "./inscricao/EtapaDocumentos";
import EtapaFormacao from "./inscricao/EtapaFormacao";
import EtapaProjetoPesquisa from "./inscricao/EtapaProjetoPesquisa";
import ProcessoTimeline from "./ProcessoTimeline";

export default function InscricaoStepper() {
	const [edital, setEdital] = useState<Edital | null>(null);
	const [editalProximo, setEditalProximo] = useState<Edital | null>(null);
	const [tiposDocumento, setTiposDocumento] = useState<TipoDocumentoEdital[]>(
		[],
	);
	const [loadingEdital, setLoadingEdital] = useState(true);
	const [semEditalAberto, setSemEditalAberto] = useState(false);
	const [documentos, setDocumentos] = useState<Documento[]>([]);
	const [emailConfirmValido, setEmailConfirmValido] = useState(false);
	const hook = useInscricao(edital);

	const {
		activeStep,
		setActiveStep,
		inscricao,
		inscricaoEnviada,
		dadosPessoais,
		setDadosPessoais,
		dadosComplementares,
		setDadosComplementares,
		projetoPesquisa,
		setProjetoPesquisa,
		saving,
		message,
		setMessage,
		handleCpfSubmit,
		continuarInscricaoExistente,
		editarInscricaoExistente,
		iniciarNovaInscricao,
		salvarEtapa2,
		salvarEtapa3,
		finalizarInscricao,
		voltarEtapa,
		reiniciar,
	} = hook;

	useEffect(() => {
		editalService
			.findVigente()
			.then(async (e) => {
				setEdital(e);
				const editalComDocs = await editalService.findWithDocumentos(
					e.id,
				);
				setTiposDocumento(editalComDocs.tiposDocumento ?? []);
			})
			.catch(async () => {
				setSemEditalAberto(true);
				const proximo = await editalService
					.findProximo()
					.catch(() => null);
				setEditalProximo(proximo);
			})
			.finally(() => setLoadingEdital(false));
	}, []);

	const todosObrigatoriosEnviados = calcTodosObrigatoriosEnviados(
		tiposDocumento,
		documentos,
	);

	const isEtapaValida = () =>
		validarEtapaAtual(activeStep, {
			projetoPesquisa,
			dadosPessoais,
			dadosComplementares,
			emailConfirmValido,
			todosObrigatoriosEnviados,
		});

	const handleNext = async () => {
		switch (activeStep) {
			case 1:
				setActiveStep(2);
				break;
			case 2:
				await salvarEtapa2();
				break;
			case 3:
				await salvarEtapa3();
				break;
			case 4:
				await finalizarInscricao();
				break;
		}
	};

	if (loadingEdital) {
		return (
			<Box sx={{ width: "100%" }}>
				<LinearProgress />
				<Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
					<CircularProgress />
				</Box>
			</Box>
		);
	}

	if (semEditalAberto) {
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

					<Typography
						variant="body1"
						color="text.secondary"
						sx={{ mb: 3 }}
					>
						Estamos preparando a plataforma de inscrições do
						Processo Seletivo PPGPCA da UFFS. Em breve você poderá
						realizar sua inscrição por aqui.
					</Typography>

					{editalProximo && (
						<>
							<Divider sx={{ my: 3 }} />
							<Typography
								variant="overline"
								color="text.secondary"
								sx={{
									display: "block",
									letterSpacing: 2,
									mb: 1,
								}}
							>
								Inscrições iniciam em
							</Typography>
							<Typography variant="h5" sx={{ fontWeight: 700 }}>
								{formatarData(
									obterDataInicioInscricao(editalProximo),
								)}
							</Typography>
						</>
					)}

					<Divider sx={{ my: 3 }} />
					<Typography variant="caption" color="text.secondary">
						Universidade Federal da Fronteira Sul — UFFS
					</Typography>
				</Paper>
			</Box>
		);
	}

	if (inscricaoEnviada && inscricao) {
		return (
			<Box sx={{ width: "100%", textAlign: "center" }}>
				<Paper sx={{ p: 4 }}>
					<CheckCircleIcon
						color="success"
						sx={{ fontSize: 64, mb: 2 }}
					/>
					<Typography variant="h5" gutterBottom>
						Inscrição enviada com sucesso!
					</Typography>
					<Typography
						variant="body1"
						color="text.secondary"
						sx={{ mb: 2 }}
					>
						Sua inscrição foi registrada com o número{" "}
						<strong>{inscricao.id}</strong>.
					</Typography>
					<Alert severity="info" sx={{ textAlign: "left", mb: 3 }}>
						Guarde o número da sua inscrição. Você pode acompanhar o
						resultado pelo{" "}
						<Link
							href={edital?.urlEditalPdf}
							target="_blank"
							rel="noopener noreferrer"
							sx={{
								fontWeight: 700,
								color: "#f5c842",
								"&:hover": { color: "#ffe680" },
							}}
						>
							edital nº {edital?.numero}
						</Link>
						.
					</Alert>
					<Box sx={{ display: "flex", justifyContent: "flex-end" }}>
						<Button
							variant="outlined"
							color="primary"
							size="small"
							onClick={reiniciar}
						>
							Voltar ao início
						</Button>
					</Box>
				</Paper>
			</Box>
		);
	}

	return (
		<Box sx={{ width: "100%" }}>
			{edital && (
				<Alert severity="info" sx={{ mb: 2 }}>
					<strong>{edital.titulo}</strong> —{" "}
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
					</Link>{" "}
					| Inscrições até {formatarData(obterDataFimInscricao(edital))}
				</Alert>
			)}

		{edital?.etapas && edital.etapas.length > 0 && (
			<ProcessoTimeline etapas={edital.etapas} />
		)}

		<Paper sx={{ p: 3 }}>
			<Stepper
					activeStep={activeStep}
					sx={{ mb: 4 }}
					alternativeLabel
				>
					{STEPS.map((label, index) => (
						<Step key={label} completed={index < activeStep}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

				{activeStep > 0 && activeStep < STEPS.length && (
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							mb: 3,
						}}
					>
						<Button
							color="inherit"
							onClick={voltarEtapa}
							variant="outlined"
							size="small"
							disabled={saving}
						>
							Voltar
						</Button>
						<Button
							variant="contained"
							color="primary"
							size="small"
							onClick={handleNext}
							disabled={saving || !isEtapaValida()}
							startIcon={
								saving ? (
									<CircularProgress size={16} />
								) : undefined
							}
						>
							{obterTextoBotaoProximo(saving, activeStep)}
						</Button>
					</Box>
				)}

				{saving && <LinearProgress sx={{ mb: 2 }} />}

				{activeStep === 0 && (
					<EtapaCpf
						onCpfSubmit={handleCpfSubmit}
						onContinuarExistente={continuarInscricaoExistente}
						onEditarInscricao={editarInscricaoExistente}
						onIniciarNova={iniciarNovaInscricao}
					/>
				)}

				{activeStep === 1 && (
					<EtapaProjetoPesquisa
						dados={projetoPesquisa}
						onChange={setProjetoPesquisa}
					/>
				)}

				{activeStep === 2 && (
					<EtapaDadosPessoais
						dados={dadosPessoais}
						onChange={setDadosPessoais}
						onConfirmValidChange={setEmailConfirmValido}
					/>
				)}

				{activeStep === 3 && (
					<EtapaFormacao
						dados={dadosComplementares}
						onChange={setDadosComplementares}
					/>
				)}

				{activeStep === 4 && inscricao && (
					<EtapaDocumentos
						idInscricao={inscricao.id}
						tiposDocumento={tiposDocumento}
						onDocumentosAtualizados={setDocumentos}
					/>
				)}

				{activeStep > 0 && activeStep < STEPS.length && (
					<Box
						sx={{
							display: "flex",
							justifyContent: "space-between",
							mt: 3,
						}}
					>
						<Button
							color="inherit"
							onClick={voltarEtapa}
							variant="outlined"
							size="small"
							disabled={saving}
						>
							Voltar
						</Button>
						<Button
							variant="contained"
							color="primary"
							size="small"
							onClick={handleNext}
							disabled={saving || !isEtapaValida()}
							startIcon={
								saving ? (
									<CircularProgress size={16} />
								) : undefined
							}
						>
							{obterTextoBotaoProximo(saving, activeStep)}
						</Button>
					</Box>
				)}
			</Paper>

			<Snackbar
				open={!!message}
				autoHideDuration={5000}
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
