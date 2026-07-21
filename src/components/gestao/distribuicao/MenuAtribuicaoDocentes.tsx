import { useEffect, useState } from "react";
import {
	Button,
	Checkbox,
	Chip,
	ListItemText,
	Menu,
	MenuItem,
	Stack,
	Tooltip,
	Typography,
} from "@mui/material";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type {
	CandidatoDistribuicao,
	DocenteAtribuido,
	DocenteDistribuicao,
} from "../../../types";

const MAXIMO_DOCENTES_PADRAO = 2;

export type ResultadoAplicarDocentes =
	| { ok: true }
	| { ok: false; choquesPorDocente: Record<string, string> };

interface MenuAtribuicaoDocentesProps {
	anchorEl: HTMLElement | null;
	candidato: CandidatoDistribuicao | null;
	docentesDisponiveis: DocenteDistribuicao[];
	/** Limite de seleção; omitir ou `null` para ilimitado. */
	maximoDocentes?: number | null;
	/** Se true, exige exatamente `maximoDocentes` selecionados para aplicar. */
	quantidadeExata?: boolean;
	onClose: () => void;
	onAplicar: (codigosDocentes: string[]) => ResultadoAplicarDocentes;
}

function possuiMatch(
	candidato: CandidatoDistribuicao,
	docente: DocenteDistribuicao,
): boolean {
	const temPalavraChave = docente.palavrasChave.some((palavra) =>
		candidato.palavrasChave.includes(palavra),
	);
	const temLinha = docente.linhasPesquisa.some(
		(lp) => lp.id === candidato.idLinhaPesquisa,
	);
	return temPalavraChave || temLinha;
}

function bloqueado(
	codigoDocente: string,
	docentesAtribuidos: DocenteAtribuido[],
): boolean {
	return docentesAtribuidos.some(
		(d) => d.codigoDocente === codigoDocente && d.temNotaLancada,
	);
}

export default function MenuAtribuicaoDocentes({
	anchorEl,
	candidato,
	docentesDisponiveis,
	maximoDocentes = MAXIMO_DOCENTES_PADRAO,
	quantidadeExata = false,
	onClose,
	onAplicar,
}: MenuAtribuicaoDocentesProps) {
	const [selecao, setSelecao] = useState<string[]>([]);
	const [choquesPorDocente, setChoquesPorDocente] = useState<
		Record<string, string>
	>({});
	const limite =
		maximoDocentes === null || maximoDocentes === undefined
			? null
			: maximoDocentes;

	useEffect(() => {
		if (candidato) {
			setSelecao(candidato.docentesAtribuidos.map((d) => d.codigoDocente));
			setChoquesPorDocente({});
		}
	}, [candidato]);

	if (!candidato) return null;

	const alternar = (codigoDocente: string) => {
		if (bloqueado(codigoDocente, candidato.docentesAtribuidos)) return;
		setChoquesPorDocente({});
		setSelecao((prev) => {
			if (prev.includes(codigoDocente)) {
				return prev.filter((c) => c !== codigoDocente);
			}
			if (limite !== null && prev.length >= limite) return prev;
			return [...prev, codigoDocente];
		});
	};

	const handleAplicar = () => {
		const resultado = onAplicar(selecao);
		if (resultado.ok) {
			setChoquesPorDocente({});
			return;
		}
		setChoquesPorDocente(resultado.choquesPorDocente);
	};

	const handleClose = () => {
		setChoquesPorDocente({});
		onClose();
	};

	const docentesOrdenados = [...docentesDisponiveis].sort((a, b) => {
		const matchA = possuiMatch(candidato, a) ? 0 : 1;
		const matchB = possuiMatch(candidato, b) ? 0 : 1;
		return matchA - matchB || a.nome.localeCompare(b.nome);
	});

	const podeAplicar =
		limite !== null && quantidadeExata ? selecao.length === limite : true;

	const textoSelecao =
		limite !== null && quantidadeExata
			? `Selecione ${limite} avaliadores (${selecao.length}/${limite})`
			: limite !== null
				? `Selecione até ${limite} avaliadores (${selecao.length}/${limite})`
				: `Selecione os avaliadores (${selecao.length} selecionado${selecao.length !== 1 ? "s" : ""})`;

	const temChoque = Object.keys(choquesPorDocente).length > 0;

	return (
		<Menu
			anchorEl={anchorEl}
			open={Boolean(anchorEl)}
			onClose={handleClose}
			slotProps={{ paper: { sx: { minWidth: 320, maxHeight: 420 } } }}
		>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ px: 2, pt: 1, pb: 0.5, display: "block" }}
			>
				{textoSelecao}
			</Typography>
			{temChoque && (
				<Typography
					variant="caption"
					color="warning.main"
					sx={{ px: 2, pb: 0.5, display: "block" }}
				>
					Há avaliador(es) com choque de horário no slot deste candidato.
				</Typography>
			)}
			{docentesOrdenados.map((docente) => {
				const selecionado = selecao.includes(docente.codigo);
				const desabilitado =
					bloqueado(docente.codigo, candidato.docentesAtribuidos) ||
					(!selecionado && limite !== null && selecao.length >= limite);
				const match = possuiMatch(candidato, docente);
				const mensagemChoque = choquesPorDocente[docente.codigo];
				return (
					<Tooltip
						key={docente.codigo}
						title={
							mensagemChoque
								? mensagemChoque
								: bloqueado(docente.codigo, candidato.docentesAtribuidos)
									? "Este docente já lançou nota para esta inscrição."
									: ""
						}
					>
						<span>
							<MenuItem
								dense
								disabled={desabilitado}
								onClick={() => alternar(docente.codigo)}
							>
								<Checkbox
									checked={selecionado}
									size="small"
									disableRipple
									tabIndex={-1}
									sx={{ p: 0, mr: 1 }}
								/>
								<ListItemText
									primary={
										<Stack
											direction="row"
											alignItems="center"
											spacing={0.75}
											component="span"
										>
											<span>{docente.nome}</span>
											{mensagemChoque && (
												<WarningAmberIcon
													fontSize="small"
													color="warning"
													aria-label="Choque de horário"
												/>
											)}
										</Stack>
									}
									secondary={`Carga atual: ${docente.cargaAtual}`}
								/>
								{match && (
									<Chip label="match" size="small" color="primary" />
								)}
							</MenuItem>
						</span>
					</Tooltip>
				);
			})}
			<Stack
				direction="row"
				sx={{ justifyContent: "flex-end", px: 2, py: 1 }}
			>
				<Button
					size="small"
					variant="contained"
					disabled={!podeAplicar}
					onClick={handleAplicar}
				>
					Aplicar
				</Button>
			</Stack>
		</Menu>
	);
}
