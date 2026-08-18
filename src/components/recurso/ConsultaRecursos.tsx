import { useRef, useState } from "react";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
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
import type {
	DocumentoRecurso,
	EtapaRecursoConsulta,
	Recurso,
	SlotDocumentoRecurso,
} from "../../types";
import {
	formatarCpf,
	limparCpf,
	validarCpfDigitos,
} from "../../controllers/cpf-controller";
import {
	formatarTamanhoArquivo,
	obterMensagemErroUpload,
	validarArquivo,
} from "../../controllers/documentos-controller";
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

function DocumentoInfo({
	documento,
	onBaixar,
	baixando,
}: {
	documento: DocumentoRecurso;
	onBaixar: () => void;
	baixando: boolean;
}) {
	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "space-between",
				gap: 1,
				flexWrap: "wrap",
				mt: 0.5,
			}}
		>
			<Box>
				<Typography variant="body2">
					{documento.nomeArquivoOriginal}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					v{documento.versao} · {formatarTamanhoArquivo(documento.tamanhoBytes)} ·{" "}
					enviado em {formatarDataHora(documento.enviadoEm)}
				</Typography>
			</Box>
			<Button
				size="small"
				startIcon={
					baixando ? <CircularProgress size={14} /> : <DownloadIcon />
				}
				onClick={onBaixar}
				disabled={baixando}
			>
				Baixar
			</Button>
		</Box>
	);
}

function SlotUpload({
	slot,
	arquivo,
	onArquivoChange,
	disabled,
}: {
	slot: SlotDocumentoRecurso;
	arquivo: File | null;
	onArquivoChange: (file: File | null) => void;
	disabled: boolean;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);

	return (
		<Box sx={{ mt: 2 }}>
			<Typography variant="subtitle2">{slot.label}</Typography>
			<input
				ref={inputRef}
				type="file"
				accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
				hidden
				onChange={(e) => {
					onArquivoChange(e.target.files?.[0] ?? null);
				}}
			/>
			<Button
				variant="outlined"
				sx={{ mt: 1 }}
				startIcon={<CloudUploadIcon />}
				disabled={disabled}
				onClick={() => inputRef.current?.click()}
			>
				{arquivo ? "Trocar arquivo" : "Anexar documento"}
			</Button>
			{arquivo && (
				<Typography variant="body2" sx={{ mt: 1 }}>
					{arquivo.name} ({formatarTamanhoArquivo(arquivo.size)})
				</Typography>
			)}
		</Box>
	);
}

function SlotDocumentoEnviado({
	slot,
	statusAtiva,
	trocando,
	baixando,
	onTrocar,
	onBaixar,
}: {
	slot: SlotDocumentoRecurso;
	statusAtiva: boolean;
	trocando: boolean;
	baixando: boolean;
	onTrocar: (file: File) => void;
	onBaixar: () => void;
}) {
	const inputRef = useRef<HTMLInputElement | null>(null);

	return (
		<Box sx={{ mt: 2 }}>
			<Typography variant="subtitle2">{slot.label}</Typography>
			{slot.documento ? (
				<DocumentoInfo
					documento={slot.documento}
					onBaixar={onBaixar}
					baixando={baixando}
				/>
			) : (
				<Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
					Nenhum documento enviado.
				</Typography>
			)}

			{statusAtiva && (
				<Box sx={{ mt: 1 }}>
					<input
						ref={inputRef}
						type="file"
						accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
						hidden
						onChange={(e) => {
							const file = e.target.files?.[0] ?? null;
							if (file) onTrocar(file);
							e.target.value = "";
						}}
					/>
					<Button
						variant="outlined"
						size="small"
						startIcon={
							trocando ? (
								<CircularProgress size={14} />
							) : (
								<CloudUploadIcon />
							)
						}
						disabled={trocando}
						onClick={() => inputRef.current?.click()}
					>
						{trocando
							? "Enviando..."
							: slot.documento
								? "Substituir documento"
								: "Enviar documento"}
					</Button>
				</Box>
			)}
		</Box>
	);
}

function RecursoCard({
	etapaConsulta,
	texto,
	onTextoChange,
	arquivos,
	onArquivoChange,
	enviando,
	onEnviar,
	trocandoPorTipo,
	onTrocarDocumento,
	baixandoPorTipo,
	onBaixarDocumento,
}: {
	etapaConsulta: EtapaRecursoConsulta;
	texto: string;
	onTextoChange: (valor: string) => void;
	arquivos: Record<number, File | null>;
	onArquivoChange: (idTipo: number, file: File | null) => void;
	enviando: boolean;
	onEnviar: () => void;
	trocandoPorTipo: Record<number, boolean>;
	onTrocarDocumento: (slot: SlotDocumentoRecurso, file: File) => void;
	baixandoPorTipo: Record<number, boolean>;
	onBaixarDocumento: (slot: SlotDocumentoRecurso) => void;
}) {
	const { recurso, slotsDocumento, status } = etapaConsulta;
	const multiplosSlots = slotsDocumento.length > 1;
	const arquivosSelecionados = slotsDocumento.filter(
		(s) => !!arquivos[s.idTipoDocumentoEdital],
	).length;
	const documentosValidos = multiplosSlots
		? arquivosSelecionados >= 1
		: slotsDocumento.length > 0 &&
			slotsDocumento.every((s) => !!arquivos[s.idTipoDocumentoEdital]);

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

						<Typography variant="subtitle1" sx={{ mb: 0.5 }}>
							Documentos do recurso
						</Typography>
						{slotsDocumento.map((slot) => (
							<SlotDocumentoEnviado
								key={slot.idTipoDocumentoEdital}
								slot={slot}
								statusAtiva={status === "ativa"}
								trocando={trocandoPorTipo[slot.idTipoDocumentoEdital] ?? false}
								baixando={baixandoPorTipo[slot.idTipoDocumentoEdital] ?? false}
								onTrocar={(file) => onTrocarDocumento(slot, file)}
								onBaixar={() => onBaixarDocumento(slot)}
							/>
						))}
						{status === "ativa" && (
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{ display: "block", mt: 2 }}
							>
								{slotsDocumento.length > 1
									? "Você pode enviar o documento faltante ou substituir os já enviados enquanto o prazo estiver aberto. Formatos: PDF, JPG, PNG ou WEBP (máx. 10 MB)."
									: "Você pode substituir o documento enquanto o prazo estiver aberto. Formatos: PDF, JPG, PNG ou WEBP (máx. 10 MB)."}
							</Typography>
						)}

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
				) : status === "ativa" ? (
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

						{slotsDocumento.map((slot) => (
							<SlotUpload
								key={slot.idTipoDocumentoEdital}
								slot={slot}
								arquivo={arquivos[slot.idTipoDocumentoEdital] ?? null}
								onArquivoChange={(file) =>
									onArquivoChange(slot.idTipoDocumentoEdital, file)
								}
								disabled={enviando}
							/>
						))}
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{ display: "block", mt: 1 }}
						>
							{multiplosSlots
								? "Envie pelo menos um dos documentos (entrevista ou currículo). Você pode enviar os dois. Formatos: PDF, JPG, PNG ou WEBP (máx. 10 MB)."
								: "Formatos aceitos: PDF, JPG, PNG ou WEBP (máx. 10 MB)."}
						</Typography>

						<Button
							variant="contained"
							sx={{ mt: 2 }}
							onClick={onEnviar}
							disabled={enviando || !texto.trim() || !documentosValidos}
							startIcon={
								enviando ? <CircularProgress size={16} /> : undefined
							}
						>
							{enviando ? "Enviando..." : "Enviar recurso"}
						</Button>
					</>
				) : status === "futura" ? (
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
	const [arquivosPorEtapa, setArquivosPorEtapa] = useState<
		Record<number, Record<number, File | null>>
	>({});
	const [enviando, setEnviando] = useState<Record<number, boolean>>({});
	const [trocandoPorTipo, setTrocandoPorTipo] = useState<
		Record<number, boolean>
	>({});
	const [baixandoPorTipo, setBaixandoPorTipo] = useState<
		Record<number, boolean>
	>({});
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
		setArquivosPorEtapa({});
		setErro("");
	};

	const atualizarSlotNaEtapa = (
		idEtapa: number,
		documento: DocumentoRecurso,
	) => {
		setEtapas((prev) =>
			prev
				? prev.map((et) => {
						if (et.etapa.id !== idEtapa) return et;
						const slotsDocumento = et.slotsDocumento.map((slot) =>
							slot.idTipoDocumentoEdital !==
							documento.idTipoDocumentoEdital
								? slot
								: { ...slot, documento },
						);
						const documentos = slotsDocumento
							.map((s) => s.documento)
							.filter((d): d is DocumentoRecurso => d !== null);
						return {
							...et,
							slotsDocumento,
							recurso: et.recurso
								? { ...et.recurso, documentos }
								: et.recurso,
						};
					})
				: prev,
		);
	};

	const handleEnviar = async (etapaConsulta: EtapaRecursoConsulta) => {
		const idEtapa = etapaConsulta.etapa.id;
		const texto = (textos[idEtapa] ?? "").trim();
		const arquivos = arquivosPorEtapa[idEtapa] ?? {};
		if (!texto) return;

		const slotsComArquivo = etapaConsulta.slotsDocumento.filter(
			(slot) => !!arquivos[slot.idTipoDocumentoEdital],
		);
		if (slotsComArquivo.length === 0) {
			setSnackbar({
				open: true,
				severity: "error",
				message:
					etapaConsulta.slotsDocumento.length > 1
						? "Envie pelo menos o documento de entrevista ou o de currículo."
						: "Anexe o documento do recurso.",
			});
			return;
		}

		for (const slot of slotsComArquivo) {
			const arquivo = arquivos[slot.idTipoDocumentoEdital]!;
			const erroArquivo = validarArquivo(arquivo);
			if (erroArquivo) {
				setSnackbar({
					open: true,
					severity: "error",
					message: `${slot.label}: ${erroArquivo}`,
				});
				return;
			}
		}

		setEnviando((prev) => ({ ...prev, [idEtapa]: true }));
		try {
			const cpfLimpo = limparCpf(cpf);
			const idInscricao = Number(numeroInscricao);

			const recurso = await recursoService.enviar({
				cpf: cpfLimpo,
				idInscricao,
				idEtapaEdital: idEtapa,
				texto,
			});

			const slotsDocumento = [...etapaConsulta.slotsDocumento];
			const errosUpload: string[] = [];

			for (const slot of slotsComArquivo) {
				const arquivo = arquivos[slot.idTipoDocumentoEdital]!;
				try {
					const documento = await recursoService.uploadDocumento(
						{
							cpf: cpfLimpo,
							idInscricao,
							idEtapaEdital: idEtapa,
							idTipoDocumentoEdital: slot.idTipoDocumentoEdital,
						},
						arquivo,
					);
					const idx = slotsDocumento.findIndex(
						(s) =>
							s.idTipoDocumentoEdital === slot.idTipoDocumentoEdital,
					);
					if (idx >= 0) {
						slotsDocumento[idx] = { ...slotsDocumento[idx], documento };
					}
				} catch (e) {
					errosUpload.push(
						`${slot.label}: ${obterMensagemErroUpload(e)}`,
					);
				}
			}

			const documentos = slotsDocumento
				.map((s) => s.documento)
				.filter((d): d is DocumentoRecurso => d !== null);

			setEtapas((prev) =>
				prev
					? prev.map((et) =>
							et.etapa.id !== idEtapa
								? et
								: {
										...et,
										recurso: { ...recurso, documentos },
										slotsDocumento,
									},
						)
					: prev,
			);
			setArquivosPorEtapa((prev) => ({ ...prev, [idEtapa]: {} }));

			if (errosUpload.length > 0) {
				setSnackbar({
					open: true,
					severity: "error",
					message: `Recurso registrado, mas houve falha em documento(s): ${errosUpload.join(" ")} Você pode reenviar enquanto o prazo estiver aberto.`,
				});
			} else {
				setSnackbar({
					open: true,
					severity: "success",
					message: "Recurso enviado com sucesso.",
				});
			}
		} catch (e) {
			setSnackbar({
				open: true,
				severity: "error",
				message: obterMensagemErroUpload(e),
			});
		} finally {
			setEnviando((prev) => ({ ...prev, [idEtapa]: false }));
		}
	};

	const handleTrocarDocumento = async (
		etapaConsulta: EtapaRecursoConsulta,
		slot: SlotDocumentoRecurso,
		file: File,
	) => {
		const erroArquivo = validarArquivo(file);
		if (erroArquivo) {
			setSnackbar({
				open: true,
				severity: "error",
				message: `${slot.label}: ${erroArquivo}`,
			});
			return;
		}

		setTrocandoPorTipo((prev) => ({
			...prev,
			[slot.idTipoDocumentoEdital]: true,
		}));
		try {
			const documento = await recursoService.uploadDocumento(
				{
					cpf: limparCpf(cpf),
					idInscricao: Number(numeroInscricao),
					idEtapaEdital: etapaConsulta.etapa.id,
					idTipoDocumentoEdital: slot.idTipoDocumentoEdital,
				},
				file,
			);
			atualizarSlotNaEtapa(etapaConsulta.etapa.id, documento);
			setSnackbar({
				open: true,
				severity: "success",
				message: `${slot.label} atualizado com sucesso.`,
			});
		} catch (e) {
			setSnackbar({
				open: true,
				severity: "error",
				message: obterMensagemErroUpload(e),
			});
		} finally {
			setTrocandoPorTipo((prev) => ({
				...prev,
				[slot.idTipoDocumentoEdital]: false,
			}));
		}
	};

	const handleBaixarDocumento = async (slot: SlotDocumentoRecurso) => {
		if (!slot.documento) return;

		setBaixandoPorTipo((prev) => ({
			...prev,
			[slot.idTipoDocumentoEdital]: true,
		}));
		try {
			const url = recursoService.getDownloadUrl(
				Number(numeroInscricao),
				slot.idTipoDocumentoEdital,
			);
			const response = await fetch(url);
			if (!response.ok) throw new Error("Falha ao baixar");
			const blob = await response.blob();
			const objectUrl = URL.createObjectURL(blob);
			const link = document.createElement("a");
			link.href = objectUrl;
			link.download = slot.documento.nomeArquivoOriginal;
			document.body.appendChild(link);
			link.click();
			link.remove();
			URL.revokeObjectURL(objectUrl);
		} catch {
			setSnackbar({
				open: true,
				severity: "error",
				message: "Não foi possível baixar o documento.",
			});
		} finally {
			setBaixandoPorTipo((prev) => ({
				...prev,
				[slot.idTipoDocumentoEdital]: false,
			}));
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
					arquivos={arquivosPorEtapa[etapaAtiva.etapa.id] ?? {}}
					onArquivoChange={(idTipo, file) =>
						setArquivosPorEtapa((prev) => ({
							...prev,
							[etapaAtiva.etapa.id]: {
								...(prev[etapaAtiva.etapa.id] ?? {}),
								[idTipo]: file,
							},
						}))
					}
					enviando={enviando[etapaAtiva.etapa.id] ?? false}
					onEnviar={() => handleEnviar(etapaAtiva)}
					trocandoPorTipo={trocandoPorTipo}
					onTrocarDocumento={(slot, file) =>
						handleTrocarDocumento(etapaAtiva, slot, file)
					}
					baixandoPorTipo={baixandoPorTipo}
					onBaixarDocumento={handleBaixarDocumento}
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
