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
import type {
	CandidatoDistribuicao,
	DocenteAtribuido,
	DocenteDistribuicao,
} from "../../../types";

const MAXIMO_DOCENTES = 2;

interface MenuAtribuicaoDocentesProps {
	anchorEl: HTMLElement | null;
	candidato: CandidatoDistribuicao | null;
	docentesDisponiveis: DocenteDistribuicao[];
	onClose: () => void;
	onAplicar: (codigosDocentes: string[]) => void;
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
	onClose,
	onAplicar,
}: MenuAtribuicaoDocentesProps) {
	const [selecao, setSelecao] = useState<string[]>([]);

	useEffect(() => {
		if (candidato) {
			setSelecao(candidato.docentesAtribuidos.map((d) => d.codigoDocente));
		}
	}, [candidato]);

	if (!candidato) return null;

	const alternar = (codigoDocente: string) => {
		if (bloqueado(codigoDocente, candidato.docentesAtribuidos)) return;
		setSelecao((prev) =>
			prev.includes(codigoDocente)
				? prev.filter((c) => c !== codigoDocente)
				: prev.length < MAXIMO_DOCENTES
					? [...prev, codigoDocente]
					: prev,
		);
	};

	const docentesOrdenados = [...docentesDisponiveis].sort((a, b) => {
		const matchA = possuiMatch(candidato, a) ? 0 : 1;
		const matchB = possuiMatch(candidato, b) ? 0 : 1;
		return matchA - matchB || a.nome.localeCompare(b.nome);
	});

	return (
		<Menu
			anchorEl={anchorEl}
			open={Boolean(anchorEl)}
			onClose={onClose}
			slotProps={{ paper: { sx: { minWidth: 320, maxHeight: 420 } } }}
		>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ px: 2, pt: 1, pb: 0.5, display: "block" }}
			>
				Selecione até {MAXIMO_DOCENTES} avaliadores ({selecao.length}/
				{MAXIMO_DOCENTES})
			</Typography>
			{docentesOrdenados.map((docente) => {
				const selecionado = selecao.includes(docente.codigo);
				const desabilitado =
					bloqueado(docente.codigo, candidato.docentesAtribuidos) ||
					(!selecionado && selecao.length >= MAXIMO_DOCENTES);
				const match = possuiMatch(candidato, docente);
				return (
					<Tooltip
						key={docente.codigo}
						title={
							bloqueado(docente.codigo, candidato.docentesAtribuidos)
								? "Este docente já lançou nota para esta inscrição."
								: ""
						}
					>
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
								primary={docente.nome}
								secondary={`Carga atual: ${docente.cargaAtual}`}
							/>
							{match && (
								<Chip label="match" size="small" color="primary" />
							)}
						</MenuItem>
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
					onClick={() => onAplicar(selecao)}
				>
					Aplicar
				</Button>
			</Stack>
		</Menu>
	);
}
