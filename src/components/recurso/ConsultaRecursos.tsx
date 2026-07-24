import { useState } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	CircularProgress,
	Divider,
	Tab,
	Tabs,
	TextField,
	Typography,
} from "@mui/material";
import type { EtapaRecursoConsulta, Recurso } from "../../types";
import {
	formatarCpf,
	limparCpf,
	validarCpfDigitos,
} from "../../controllers/cpf-controller";
import { recursoService } from "../../services/recurso.service";

function formatarDataHora(iso: string): string {
	return new Date(iso).toLocaleString("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	});
}

function ChipDecisao({ recurso }: { recurso: Recurso }) {
	if (recurso.deferido === null) {
		return <Chip label="Aguardando análise" size="small" variant="outlined" />;
	}
	return (
		<Chip
			label={recurso.deferido ? "Deferido" : "Indeferido"}
			size="small"
			color={recurso.deferido ? "success" : "error"}
		/>
	);
}

function RecursoCard({
	etapaConsulta,
	texto,
	onTextoChange,
	enviando,
	onEnviar,
}: {
	etapaConsulta: EtapaRecursoConsulta;
	texto: string;
	onTextoChange: (valor: string) => void;
	enviando: boolean;
	onEnviar: () => void;
}) {
	const { recurso } = etapaConsulta;

	return (
		<Card variant="outlined" sx={{ mb: 2 }}>
			<CardContent>
				{recurso ? (
					<>
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ display: "block" }}
						>
							Enviado em {formatarDataHora(recurso.createdAt)}
						</Typography>
						<Typography variant="body2" sx={{ mt: 1, whiteSpace: "pre-wrap" }}>
							{recurso.texto}
						</Typography>

						<Divider sx={{ my: 2 }} />

						<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
							<Typography variant="subtitle2">Resposta</Typography>
							<ChipDecisao recurso={recurso} />
						</Box>
						{recurso.deferido !== null ? (
							<>
								<Typography
									variant="caption"
									color="text.secondary"
									sx={{ display: "block" }}
								>
									Respondido em {formatarDataHora(recurso.updatedAt)}
								</Typography>
								<Typography
									variant="body2"
									sx={{ mt: 1, whiteSpace: "pre-wrap" }}
								>
									{recurso.comentario}
								</Typography>
							</>
						) : (
							<Typography variant="body2" color="text.secondary">
								Seu recurso ainda não foi avaliado.
							</Typography>
						)}
					</>
				) : etapaConsulta.status === "ativa" ? (
					<>
						<TextField
							fullWidth
							multiline
							minRows={4}
							label="Argumentação do recurso"
							value={texto}
							onChange={(e) => onTextoChange(e.target.value)}
							disabled={enviando}
						/>
						<Button
							variant="contained"
							sx={{ mt: 2 }}
							onClick={onEnviar}
							disabled={enviando || !texto.trim()}
							startIcon={
								enviando ? <CircularProgress size={16} /> : undefined
							}
						>
							{enviando ? "Enviando..." : "Enviar recurso"}
						</Button>
					</>
				) : etapaConsulta.status === "futura" ? (
					<Typography variant="body2" color="text.secondary">
						O prazo de recurso desta etapa ainda não foi iniciado.
						{etapaConsulta.etapa.dataInicio
							? ` Previsão de início em ${formatarDataHora(etapaConsulta.etapa.dataInicio)}.`
							: ""}
					</Typography>
				) : (
					<Typography variant="body2" color="text.secondary">
						O prazo de recurso desta etapa foi encerrado e nenhum recurso
						foi enviado.
					</Typography>
				)}
			</CardContent>
		</Card>
	);
}

export default function ConsultaRecursos() {
	const [cpf, setCpf] = useState("");
	const [numeroInscricao, setNumeroInscricao] = useState("");
	const [loading, setLoading] = useState(false);
	const [erro, setErro] = useState("");

	const [etapas, setEtapas] = useState<EtapaRecursoConsulta[] | null>(null);
	const [abaAtiva, setAbaAtiva] = useState<string>("");
	const [textos, setTextos] = useState<Record<number, string>>({});
	const [enviando, setEnviando] = useState<Record<number, boolean>>({});
	const [snackbar, setSnackbar] = useState<{
		open: boolean;
		severity: "success" | "error";
		message: string;
	}>({ open: false, severity: "success", message: "" });

	const handleConsultar = async (e: React.FormEvent) => {
		e.preventDefault();
		const cpfLimpo = limparCpf(cpf);
		const validacao = validarCpfDigitos(cpfLimpo);
		if (!validacao.valido) {
			setErro(validacao.erro ?? "");
			return;
		}
		if (!numeroInscricao.trim()) {
			setErro("Informe o número de inscrição.");
			return;
		}

		setErro("");
		setLoading(true);
		try {
			const dados = await recursoService.consultar(
				cpfLimpo,
				Number(numeroInscricao),
			);
			if (dados.length === 0) {
				setErro(
					"Nenhuma etapa de recurso está disponível para este edital.",
				);
				return;
			}
			setEtapas(dados);
			const ativa = dados.find((d) => d.status === "ativa") ?? dados[0];
			setAbaAtiva(ativa.etapa.nome);
		} catch (err) {
			const status = (err as { response?: { status: number } })?.response
				?.status;
			setErro(
				status === 404
					? "Inscrição não encontrada. Verifique o CPF e o número de inscrição."
					: "Erro ao consultar recursos. Tente novamente.",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleNovaConsulta = () => {
		setEtapas(null);
		setNumeroInscricao("");
		setTextos({});
		setErro("");
	};

	const handleEnviar = async (etapaConsulta: EtapaRecursoConsulta) => {
		const idEtapa = etapaConsulta.etapa.id;
		const texto = (textos[idEtapa] ?? "").trim();
		if (!texto) return;

		setEnviando((prev) => ({ ...prev, [idEtapa]: true }));
		try {
			const recurso = await recursoService.enviar({
				cpf: limparCpf(cpf),
				idInscricao: Number(numeroInscricao),
				idEtapaEdital: idEtapa,
				texto,
			});
			setEtapas((prev) =>
				prev
					? prev.map((et) =>
							et.etapa.id !== idEtapa ? et : { ...et, recurso },
						)
					: prev,
			);
			setSnackbar({
				open: true,
				severity: "success",
				message: "Recurso enviado com sucesso.",
			});
		} catch {
			setSnackbar({
				open: true,
				severity: "error",
				message: "Erro ao enviar recurso. Tente novamente.",
			});
		} finally {
			setEnviando((prev) => ({ ...prev, [idEtapa]: false }));
		}
	};

	if (!etapas) {
		return (
			<Box>
				<Typography variant="h5" sx={{ mb: 1 }}>
					Recursos
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
					Informe seu CPF e o número da sua inscrição para enviar ou
					consultar recursos.
				</Typography>

				<Box component="form" onSubmit={handleConsultar} sx={{ maxWidth: 400 }}>
					<TextField
						fullWidth
						label="CPF"
						value={cpf}
						onChange={(e) => setCpf(formatarCpf(e.target.value))}
						placeholder="000.000.000-00"
						slotProps={{ htmlInput: { maxLength: 14 } }}
						sx={{ mb: 2 }}
						autoFocus
					/>
					<TextField
						fullWidth
						label="Número de inscrição"
						value={numeroInscricao}
						onChange={(e) => setNumeroInscricao(e.target.value)}
						slotProps={{ htmlInput: { inputMode: "numeric" } }}
						sx={{ mb: 2 }}
					/>

					{erro && (
						<Alert severity="error" sx={{ mb: 2 }}>
							{erro}
						</Alert>
					)}

					<Button
						type="submit"
						variant="contained"
						disabled={loading}
						startIcon={loading ? <CircularProgress size={16} /> : undefined}
					>
						{loading ? "Consultando..." : "Consultar"}
					</Button>
				</Box>
			</Box>
		);
	}

	const etapaAtiva = etapas.find((et) => et.etapa.nome === abaAtiva);

	return (
		<Box>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 2,
				}}
			>
				<Typography variant="h5">Recursos</Typography>
				<Button variant="text" onClick={handleNovaConsulta}>
					Nova consulta
				</Button>
			</Box>

			<Tabs
				value={abaAtiva}
				onChange={(_, valor) => setAbaAtiva(valor)}
				sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
				variant="scrollable"
				scrollButtons="auto"
			>
				{etapas.map((et) => (
					<Tab
						key={et.etapa.nome}
						value={et.etapa.nome}
						label={et.etapa.nome}
					/>
				))}
			</Tabs>

			{etapaAtiva && (
				<RecursoCard
					etapaConsulta={etapaAtiva}
					texto={textos[etapaAtiva.etapa.id] ?? ""}
					onTextoChange={(valor) =>
						setTextos((prev) => ({
							...prev,
							[etapaAtiva.etapa.id]: valor,
						}))
					}
					enviando={enviando[etapaAtiva.etapa.id] ?? false}
					onEnviar={() => handleEnviar(etapaAtiva)}
				/>
			)}

			{snackbar.open && (
				<Alert
					severity={snackbar.severity}
					sx={{ mt: 2 }}
					onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
				>
					{snackbar.message}
				</Alert>
			)}
		</Box>
	);
}
