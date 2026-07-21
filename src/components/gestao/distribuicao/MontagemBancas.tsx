import { useEffect, useMemo, useState } from "react";
import {
	Alert,
	Badge,
	Box,
	Button,
	Card,
	CardContent,
	Checkbox,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	Snackbar,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ShuffleIcon from "@mui/icons-material/Shuffle";
import SyncIcon from "@mui/icons-material/Sync";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import type { GridColDef } from "@mui/x-data-grid";
import { GridToolbarQuickFilter } from "@mui/x-data-grid";
import CustomDataGrid from "../../customs/CustomDataGrid";
import { customColors } from "../../../theme/customColors";
import type {
	AppMessage,
	AtribuicaoItem,
	CandidatoDistribuicao,
	DocenteAtribuido,
	DocenteDistribuicao,
} from "../../../types";
import {
	DURACAO_SLOT_MIN,
	encontrarChoqueHorario,
	encontrarChoquesJanelaBancasPorDocente,
	encontrarChoquesPorDocente,
	encontrarChoquesSlotNaJanelaPorDocente,
	mensagemChoqueHorario,
	type CompromissoAvaliador,
} from "./choqueHorarioAvaliadores";
import MenuAtribuicaoDocentes, {
	type ResultadoAplicarDocentes,
} from "./MenuAtribuicaoDocentes";

type Periodo = "MANHA" | "TARDE" | "NOITE";

const LABEL_PERIODO: Record<Periodo, string> = {
	MANHA: "Manhã",
	TARDE: "Tarde",
	NOITE: "Noite",
};

function mascaraCpf(cpf: string): string {
	if (!cpf) return "";
	const limpo = cpf.replace(/\D/g, "");
	if (limpo.length !== 11) return cpf;
	return `***.${limpo.slice(3, 6)}.${limpo.slice(6, 8)}*-**`;
}

interface Banca {
	id: string;
	periodo?: Periodo;
	data: string;
	horaInicio: string;
	horaFim: string;
	codigosDocentes: string[];
}

interface AtribuicaoPendente {
	codigosDocentes: string[];
	dataBanca?: string | null;
}

const BANCA_VAZIA = (mostrarPeriodo: boolean): Banca => ({
	id: crypto.randomUUID(),
	periodo: mostrarPeriodo ? "MANHA" : undefined,
	data: "",
	horaInicio: "",
	horaFim: "",
	codigosDocentes: [],
});

function chaveDocentes(codigos: string[]): string {
	return [...codigos].sort().join("|");
}

function minutosDesdeMeiaNoite(hora: string): number {
	const [h, m] = hora.split(":").map(Number);
	return h * 60 + m;
}

function formatarHora(minutos: number): string {
	const h = Math.floor(minutos / 60);
	const m = minutos % 60;
	return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Slots de 30 min cujo início + duração cabe no intervalo [horaInicio, horaFim]. */
function gerarHorariosSlots(horaInicio: string, horaFim: string): string[] {
	if (!horaInicio || !horaFim) return [];
	const inicio = minutosDesdeMeiaNoite(horaInicio);
	const fim = minutosDesdeMeiaNoite(horaFim);
	if (Number.isNaN(inicio) || Number.isNaN(fim) || fim <= inicio) return [];

	const slots: string[] = [];
	for (let t = inicio; t + DURACAO_SLOT_MIN <= fim; t += DURACAO_SLOT_MIN) {
		slots.push(formatarHora(t));
	}
	return slots;
}

function montarDataBanca(data: string, hora: string): string {
	const [ano, mes, dia] = data.split("-").map(Number);
	const [hh, mm] = hora.split(":").map(Number);
	return new Date(ano, mes - 1, dia, hh, mm, 0, 0).toISOString();
}

function dataLocalDeIso(iso: string): string {
	const d = new Date(iso);
	const ano = d.getFullYear();
	const mes = String(d.getMonth() + 1).padStart(2, "0");
	const dia = String(d.getDate()).padStart(2, "0");
	return `${ano}-${mes}-${dia}`;
}

function horaLocalDeIso(iso: string): string {
	const d = new Date(iso);
	return formatarHora(d.getHours() * 60 + d.getMinutes());
}

function formatarDataBanca(iso: string | null | undefined): string {
	if (!iso) return "—";
	return new Date(iso).toLocaleString("pt-BR", {
		dateStyle: "short",
		timeStyle: "short",
	});
}

/**
 * Distribui `numCandidatos` igualmente entre bancas, respeitando capacidade
 * de slots. Restos ímpares são atribuídos a bancas escolhidas aleatoriamente.
 */
function calcularQuotas(numCandidatos: number, capacidades: number[]): number[] {
	const quotas = capacidades.map(() => 0);
	const livres = [...capacidades];
	let remaining = Math.min(
		numCandidatos,
		capacidades.reduce((a, b) => a + b, 0),
	);

	while (remaining > 0) {
		const ativos = livres
			.map((livre, i) => ({ i, livre }))
			.filter((a) => a.livre > 0);
		if (ativos.length === 0) break;

		const base = Math.floor(remaining / ativos.length);
		const resto = remaining % ativos.length;
		const ordem = embaralhar(ativos);

		if (base === 0) {
			for (let r = 0; r < resto; r++) {
				const a = ordem[r];
				quotas[a.i]++;
				livres[a.i]--;
				remaining--;
			}
			continue;
		}

		let assigned = 0;
		for (let idx = 0; idx < ordem.length; idx++) {
			const a = ordem[idx];
			let receber = base + (idx < resto ? 1 : 0);
			receber = Math.min(receber, livres[a.i]);
			quotas[a.i] += receber;
			livres[a.i] -= receber;
			assigned += receber;
		}
		remaining -= assigned;
		if (assigned === 0) break;
	}

	return quotas;
}

function bancasAPartirDeCandidatos(candidatos: CandidatoDistribuicao[]): Banca[] {
	const mapa = new Map<string, Banca>();
	for (const candidato of candidatos) {
		if (candidato.docentesAtribuidos.length === 0) continue;
		const codigos = candidato.docentesAtribuidos.map((d) => d.codigoDocente);
		const chave = chaveDocentes(codigos);
		if (!mapa.has(chave)) {
			mapa.set(chave, {
				id: crypto.randomUUID(),
				data: "",
				horaInicio: "",
				horaFim: "",
				codigosDocentes: [...codigos].sort(),
			});
		}
	}
	return [...mapa.values()];
}

function formatarDataDdMmYyyy(data: string): string {
	if (!data) return "";
	const [ano, mes, dia] = data.split("-");
	if (!ano || !mes || !dia) return data;
	return `${dia}/${mes}/${ano}`;
}

function cabecalhoHorarioBanca(
	banca: Banca,
	primeiroSlotAtribuido: { data: string; hora: string } | null,
): string {
	const slots = gerarHorariosSlots(banca.horaInicio, banca.horaFim);
	const horaConfig = slots[0] ?? banca.horaInicio;
	const dataConfig = formatarDataDdMmYyyy(banca.data);

	if (dataConfig && horaConfig) {
		return `${dataConfig} · ${horaConfig}`;
	}

	if (primeiroSlotAtribuido) {
		return `${formatarDataDdMmYyyy(primeiroSlotAtribuido.data)} · ${primeiroSlotAtribuido.hora}`;
	}

	return dataConfig || horaConfig || "Data/horário não definidos";
}

function avaliadoresBancaOrdenados(
	banca: Banca,
	docentesDisponiveis: DocenteDistribuicao[],
): { codigo: string; nome: string }[] {
	return banca.codigosDocentes
		.map((codigo) => ({
			codigo,
			nome:
				docentesDisponiveis.find((d) => d.codigo === codigo)?.nome ?? codigo,
		}))
		.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
}

function embaralhar<T>(lista: T[]): T[] {
	const copia = [...lista];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

const dataGridBgSx = (bgColor: string) => ({
	backgroundColor: bgColor,
	"& .MuiDataGrid-columnHeaders": { backgroundColor: bgColor },
	"& .MuiDataGrid-columnHeader": { backgroundColor: bgColor },
	"& .MuiDataGrid-columnHeadersInner": { backgroundColor: bgColor },
	"& .MuiDataGrid-scrollbarFiller": { backgroundColor: bgColor },
	"& .MuiDataGrid-footerContainer": { backgroundColor: bgColor },
	"& .MuiDataGrid-row": { backgroundColor: bgColor },
	"& .MuiDataGrid-filler": { backgroundColor: bgColor },
});

function BarraBusca() {
	return (
		<Box sx={{ p: 1 }}>
			<GridToolbarQuickFilter
				slotProps={{
					root: {
						fullWidth: true,
						size: "small",
						placeholder: "Buscar candidato...",
					},
				}}
			/>
		</Box>
	);
}

interface MontagemBancasProps {
	mostrarPeriodo: boolean;
	maximoDocentes?: number | null;
	quantidadeExata?: boolean;
	docentesDisponiveis: DocenteDistribuicao[];
	candidatos: CandidatoDistribuicao[];
	salvando: boolean;
	erro: string | null;
	onSalvarAtribuicoes: (
		itens: AtribuicaoItem[],
	) => Promise<{ sucesso: { idInscricao: number }[]; falhas: { idInscricao: number; motivo: string }[] } | undefined>;
	onTemPendenciasChange?: (temPendencias: boolean) => void;
}

export default function MontagemBancas({
	mostrarPeriodo,
	maximoDocentes = null,
	quantidadeExata = false,
	docentesDisponiveis,
	candidatos,
	salvando,
	erro,
	onSalvarAtribuicoes,
	onTemPendenciasChange,
}: MontagemBancasProps) {
	const theme = useTheme();
	const iconColor =
		theme.palette.mode === "light"
			? customColors.teal
			: customColors.platinum;
	const iconHoverColor =
		theme.palette.mode === "light"
			? customColors.darkGray
			: customColors.veronica;
	const iconButtonSx = {
		color: iconColor,
		"& .MuiSvgIcon-root": { color: iconColor },
		"&:hover": { color: iconHoverColor },
		"&:hover .MuiSvgIcon-root": { color: iconHoverColor },
	};
	const [bancas, setBancas] = useState<Banca[]>([]);
	const [dialogAberto, setDialogAberto] = useState(false);
	const [bancaEditando, setBancaEditando] = useState<Banca | null>(null);
	const [form, setForm] = useState<Banca>(BANCA_VAZIA(mostrarPeriodo));
	const [confirmarRemocao, setConfirmarRemocao] = useState<Banca | null>(null);
	const [atribuicaoLocal, setAtribuicaoLocal] = useState<
		Record<number, AtribuicaoPendente>
	>({});
	const [menuDocentesAncora, setMenuDocentesAncora] =
		useState<HTMLElement | null>(null);
	const [candidatoSelecionado, setCandidatoSelecionado] =
		useState<CandidatoDistribuicao | null>(null);
	const [message, setMessage] = useState<AppMessage | null>(null);
	const [falhas, setFalhas] = useState<{ idInscricao: number; motivo: string }[]>(
		[],
	);
	const [confirmarRedistribuicao, setConfirmarRedistribuicao] = useState(false);
	const [dialogSlotAberto, setDialogSlotAberto] = useState(false);
	const [candidatoSlot, setCandidatoSlot] =
		useState<CandidatoDistribuicao | null>(null);
	const [formSlot, setFormSlot] = useState({ data: "", hora: "" });
	const [slotJaExistia, setSlotJaExistia] = useState(false);
	const [choquesBancaPorDocente, setChoquesBancaPorDocente] = useState<
		Record<string, string>
	>({});

	const contadorPendentes = Object.keys(atribuicaoLocal).length;

	const docentesEfetivos = (
		candidato: CandidatoDistribuicao,
	): DocenteAtribuido[] => {
		const pendente = atribuicaoLocal[candidato.idInscricao];
		if (!pendente) return candidato.docentesAtribuidos;

		const porCodigo = new Map(
			candidato.docentesAtribuidos.map((d) => [d.codigoDocente, d]),
		);
		return pendente.codigosDocentes.map((codigo) => {
			const existente = porCodigo.get(codigo);
			if (existente) return existente;
			return {
				codigoDocente: codigo,
				nome:
					docentesDisponiveis.find((d) => d.codigo === codigo)?.nome ?? codigo,
				temNotaLancada: false,
			};
		});
	};

	const temBancaSemCandidatos = bancas.some((banca) => {
		const chave = chaveDocentes(banca.codigosDocentes);
		return !candidatos.some(
			(c) => chaveDocentes(docentesEfetivos(c).map((d) => d.codigoDocente)) === chave,
		);
	});

	useEffect(() => {
		onTemPendenciasChange?.(contadorPendentes > 0 || temBancaSemCandidatos);
	}, [contadorPendentes, temBancaSemCandidatos, onTemPendenciasChange]);

	useEffect(() => {
		return () => onTemPendenciasChange?.(false);
	}, [onTemPendenciasChange]);

	const dataBancaEfetiva = (
		candidato: CandidatoDistribuicao,
	): string | null => {
		const pendente = atribuicaoLocal[candidato.idInscricao];
		if (pendente && "dataBanca" in pendente) {
			return pendente.dataBanca ?? null;
		}
		return candidato.dataBanca ?? null;
	};

	const nomeDocente = (codigo: string): string =>
		docentesDisponiveis.find((d) => d.codigo === codigo)?.nome ?? codigo;

	/** Agenda efetiva (servidor + pendências locais) por avaliador/slot. */
	const listarCompromissosAvaliadores = (): CompromissoAvaliador[] => {
		const lista: CompromissoAvaliador[] = [];
		for (const candidato of candidatos) {
			const iso = dataBancaEfetiva(candidato);
			if (!iso) continue;
			const inicioMs = new Date(iso).getTime();
			if (Number.isNaN(inicioMs)) continue;
			for (const docente of docentesEfetivos(candidato)) {
				lista.push({
					codigoDocente: docente.codigoDocente,
					nomeDocente: docente.nome || nomeDocente(docente.codigoDocente),
					idInscricao: candidato.idInscricao,
					nomeCandidato: candidato.nome,
					inicioMs,
				});
			}
		}
		return lista;
	};

	const idsCandidatosDaBanca = (banca: Banca): number[] => {
		const chave = chaveDocentes(banca.codigosDocentes);
		return candidatos
			.filter(
				(c) =>
					chaveDocentes(
						docentesEfetivos(c).map((d) => d.codigoDocente),
					) === chave,
			)
			.map((c) => c.idInscricao);
	};

	/** Data e horário do slot mais cedo entre os candidatos da banca. */
	const primeiroSlotAtribuidoDaBanca = (
		banca: Banca,
	): { data: string; hora: string } | null => {
		const chave = chaveDocentes(banca.codigosDocentes);
		let maisCedo: string | null = null;
		for (const candidato of candidatos) {
			const chaveCandidato = chaveDocentes(
				docentesEfetivos(candidato).map((d) => d.codigoDocente),
			);
			if (chaveCandidato !== chave) continue;
			const iso = dataBancaEfetiva(candidato);
			if (!iso) continue;
			if (
				!maisCedo ||
				new Date(iso).getTime() < new Date(maisCedo).getTime()
			) {
				maisCedo = iso;
			}
		}
		if (!maisCedo) return null;
		return {
			data: dataLocalDeIso(maisCedo),
			hora: horaLocalDeIso(maisCedo),
		};
	};

	/** Já persistido em nota_criterio — não entra na redistribuição automática. */
	const sincronizadoNoServidor = (candidato: CandidatoDistribuicao): boolean =>
		candidato.docentesAtribuidos.length > 0;

	const todosSincronizados =
		candidatos.length > 0 &&
		candidatos.every((c) => sincronizadoNoServidor(c));

	useEffect(() => {
		const seed = bancasAPartirDeCandidatos(candidatos);
		if (seed.length === 0) return;
		setBancas((prev) => {
			if (prev.length > 0) {
				const existentes = new Set(
					prev.map((b) => chaveDocentes(b.codigosDocentes)),
				);
				const novas = seed.filter(
					(b) => !existentes.has(chaveDocentes(b.codigosDocentes)),
				);
				return novas.length > 0 ? [...prev, ...novas] : prev;
			}
			return seed;
		});
	}, [candidatos]);

	const abrirCriar = () => {
		setBancaEditando(null);
		setForm(BANCA_VAZIA(mostrarPeriodo));
		setChoquesBancaPorDocente({});
		setDialogAberto(true);
	};

	const abrirEditar = (banca: Banca) => {
		setBancaEditando(banca);
		setForm({
			...banca,
			horaInicio: banca.horaInicio ?? "",
			horaFim: banca.horaFim ?? "",
		});
		setChoquesBancaPorDocente({});
		setDialogAberto(true);
	};

	const fecharDialog = () => {
		setDialogAberto(false);
		setBancaEditando(null);
		setForm(BANCA_VAZIA(mostrarPeriodo));
		setChoquesBancaPorDocente({});
	};

	const atualizarFormBanca = (patch: Partial<Banca>) => {
		setChoquesBancaPorDocente({});
		setForm((prev) => ({ ...prev, ...patch }));
	};

	const salvarBanca = () => {
		if (mostrarPeriodo && form.data && form.horaInicio && form.horaFim) {
			const choques: Record<string, string> = {};

			const choquesJanela = encontrarChoquesJanelaBancasPorDocente({
				banca: form,
				outras: bancas,
				nomeDocente,
			});
			for (const [codigo, mensagem] of choquesJanela) {
				choques[codigo] = mensagem;
			}

			const idsIgnorar = bancaEditando
				? idsCandidatosDaBanca(bancaEditando)
				: [];
			const choquesSlot = encontrarChoquesSlotNaJanelaPorDocente({
				codigosDocentes: form.codigosDocentes,
				data: form.data,
				horaInicio: form.horaInicio,
				horaFim: form.horaFim,
				compromissos: listarCompromissosAvaliadores(),
				idsInscricaoIgnorar: idsIgnorar,
			});
			for (const [codigo, choque] of choquesSlot) {
				if (!choques[codigo]) {
					choques[codigo] = mensagemChoqueHorario(choque);
				}
			}

			if (Object.keys(choques).length > 0) {
				setChoquesBancaPorDocente(choques);
				setMessage({
					text: Object.values(choques).join(" "),
					severity: "error",
				});
				return;
			}
		}

		setChoquesBancaPorDocente({});
		if (bancaEditando) {
			setBancas((prev) =>
				prev.map((b) => (b.id === bancaEditando.id ? form : b)),
			);
		} else {
			setBancas((prev) => [...prev, form]);
		}
		fecharDialog();
	};

	const removerBanca = (banca: Banca) => {
		const chaveRemovida = chaveDocentes(banca.codigosDocentes);

		const candidatosDaBanca = candidatos.filter((c) => {
			const pendente = atribuicaoLocal[c.idInscricao];
			const codigos = pendente
				? pendente.codigosDocentes
				: c.docentesAtribuidos.map((d) => d.codigoDocente);
			return chaveDocentes(codigos) === chaveRemovida;
		});

		const comNotaLancada = candidatosDaBanca.filter(
			(c) =>
				chaveDocentes(c.docentesAtribuidos.map((d) => d.codigoDocente)) ===
					chaveRemovida &&
				c.docentesAtribuidos.some((d) => d.temNotaLancada),
		);
		if (comNotaLancada.length > 0) {
			setMessage({
				text: `Não é possível remover a banca: ${comNotaLancada.length} candidato(s) já possuem nota lançada.`,
				severity: "error",
			});
			setConfirmarRemocao(null);
			return;
		}

		setBancas((prev) => prev.filter((b) => b.id !== banca.id));
		setAtribuicaoLocal((prev) => {
			const next = { ...prev };
			for (const candidato of candidatosDaBanca) {
				const originais = candidato.docentesAtribuidos.map(
					(d) => d.codigoDocente,
				);
				const sincronizadoNestaBanca =
					chaveDocentes(originais) === chaveRemovida;

				if (sincronizadoNestaBanca) {
					// Pendência de remoção — efetivada ao clicar em Sincronizar.
					next[candidato.idInscricao] = mostrarPeriodo
						? { codigosDocentes: [], dataBanca: null }
						: { codigosDocentes: [] };
				} else {
					delete next[candidato.idInscricao];
				}
			}
			return next;
		});
		setConfirmarRemocao(null);
	};

	const aplicarAtribuicaoLocal = (
		idInscricao: number,
		codigosDocentes: string[],
		dataBanca?: string | null,
	) => {
		const candidato = candidatos.find((c) => c.idInscricao === idInscricao);
		if (!candidato) return;

		const originais = candidato.docentesAtribuidos.map((d) => d.codigoDocente);
		const mesmaAtribuicao =
			chaveDocentes(originais) === chaveDocentes(codigosDocentes);

		setAtribuicaoLocal((prev) => {
			const next = { ...prev };
			const anterior = prev[idInscricao];
			const dataEfetiva =
				dataBanca !== undefined
					? dataBanca
					: (anterior?.dataBanca ?? candidato.dataBanca ?? null);
			const mesmaData =
				(dataEfetiva ?? null) === (candidato.dataBanca ?? null);

			if (mesmaAtribuicao && mesmaData) {
				delete next[idInscricao];
			} else {
				next[idInscricao] = {
					codigosDocentes: [...codigosDocentes].sort(),
					dataBanca: dataEfetiva,
				};
			}
			return next;
		});
	};

	/** Remove a banca do candidato localmente; Sincronizar efetiva, Cancelar desfaz. */
	const removerAtribuicaoCandidato = (candidato: CandidatoDistribuicao) => {
		const efetivos = docentesEfetivos(candidato);
		if (efetivos.length === 0) return;

		if (candidato.docentesAtribuidos.some((d) => d.temNotaLancada)) {
			setMessage({
				text: "Não é possível remover a atribuição: já existe nota lançada para este candidato.",
				severity: "error",
			});
			return;
		}

		const originais = candidato.docentesAtribuidos.map((d) => d.codigoDocente);
		if (originais.length === 0) {
			setAtribuicaoLocal((prev) => {
				const next = { ...prev };
				delete next[candidato.idInscricao];
				return next;
			});
			return;
		}

		setAtribuicaoLocal((prev) => ({
			...prev,
			[candidato.idInscricao]: mostrarPeriodo
				? { codigosDocentes: [], dataBanca: null }
				: { codigosDocentes: [] },
		}));
	};

	const abrirMenuDocentes = (
		event: React.MouseEvent<HTMLElement>,
		candidato: CandidatoDistribuicao,
	) => {
		setMenuDocentesAncora(event.currentTarget);
		setCandidatoSelecionado({
			...candidato,
			docentesAtribuidos: docentesEfetivos(candidato),
		});
	};

	const fecharMenuDocentes = () => {
		setMenuDocentesAncora(null);
		setCandidatoSelecionado(null);
	};

	const handleAplicarDocentes = (
		codigosDocentes: string[],
	): ResultadoAplicarDocentes => {
		if (!candidatoSelecionado) return { ok: true };

		if (mostrarPeriodo && codigosDocentes.length > 0) {
			const iso = dataBancaEfetiva(candidatoSelecionado);
			if (iso) {
				const inicioMs = new Date(iso).getTime();
				if (!Number.isNaN(inicioMs)) {
					const choques = encontrarChoquesPorDocente({
						codigosDocentes,
						inicioMs,
						compromissos: listarCompromissosAvaliadores(),
						idInscricaoIgnorar: candidatoSelecionado.idInscricao,
					});
					if (choques.size > 0) {
						const choquesPorDocente: Record<string, string> = {};
						for (const [codigo, choque] of choques) {
							choquesPorDocente[codigo] = mensagemChoqueHorario(choque);
						}
						setMessage({
							text: Object.values(choquesPorDocente).join(" "),
							severity: "error",
						});
						return { ok: false, choquesPorDocente };
					}
				}
			}
		}

		aplicarAtribuicaoLocal(candidatoSelecionado.idInscricao, codigosDocentes);
		fecharMenuDocentes();
		return { ok: true };
	};

	const abrirDialogSlot = (candidato: CandidatoDistribuicao) => {
		const dataAtual = dataBancaEfetiva(candidato);
		setCandidatoSlot(candidato);
		setSlotJaExistia(Boolean(dataAtual));
		setFormSlot({
			data: dataAtual ? dataLocalDeIso(dataAtual) : "",
			hora: dataAtual ? horaLocalDeIso(dataAtual) : "",
		});
		setDialogSlotAberto(true);
	};

	const fecharDialogSlot = () => {
		setDialogSlotAberto(false);
		setCandidatoSlot(null);
		setFormSlot({ data: "", hora: "" });
		setSlotJaExistia(false);
	};

	/** Altera só o slot; a banca (avaliadores) permanece intacta. */
	const salvarSlotCandidato = () => {
		if (!candidatoSlot || !formSlot.data || !formSlot.hora) return;
		const codigos = docentesEfetivos(candidatoSlot).map((d) => d.codigoDocente);
		const dataBancaIso = montarDataBanca(formSlot.data, formSlot.hora);

		if (codigos.length > 0) {
			const inicioMs = new Date(dataBancaIso).getTime();
			if (!Number.isNaN(inicioMs)) {
				const choque = encontrarChoqueHorario({
					codigosDocentes: codigos,
					inicioMs,
					compromissos: listarCompromissosAvaliadores(),
					idInscricaoIgnorar: candidatoSlot.idInscricao,
				});
				if (choque) {
					setMessage({
						text: mensagemChoqueHorario(choque),
						severity: "error",
					});
					return;
				}
			}
		}

		aplicarAtribuicaoLocal(
			candidatoSlot.idInscricao,
			codigos,
			dataBancaIso,
		);
		fecharDialogSlot();
	};

	/** Remove só o slot; a banca permanece. Sincronizar efetiva, Cancelar desfaz. */
	const removerSlotCandidato = (candidato: CandidatoDistribuicao) => {
		if (!dataBancaEfetiva(candidato)) return;
		aplicarAtribuicaoLocal(
			candidato.idInscricao,
			docentesEfetivos(candidato).map((d) => d.codigoDocente),
			null,
		);
	};

	const slotsOcupadosDaBanca = (banca: Banca): Set<string> => {
		const chave = chaveDocentes(banca.codigosDocentes);
		const ocupados = new Set<string>();
		for (const candidato of candidatos) {
			if (!sincronizadoNoServidor(candidato) || !candidato.dataBanca) continue;
			const chaveCandidato = chaveDocentes(
				candidato.docentesAtribuidos.map((d) => d.codigoDocente),
			);
			if (chaveCandidato !== chave) continue;
			if (dataLocalDeIso(candidato.dataBanca) !== banca.data) continue;
			ocupados.add(horaLocalDeIso(candidato.dataBanca));
		}
		return ocupados;
	};

	const distribuirPorSlots = () => {
		const bancasComSlots = bancas
			.map((banca) => {
				const todosSlots = gerarHorariosSlots(banca.horaInicio, banca.horaFim);
				const ocupados = slotsOcupadosDaBanca(banca);
				const slots = todosSlots.filter((slot) => !ocupados.has(slot));
				return { banca, slots, slotsOcupados: ocupados.size };
			})
			.filter((b) => b.banca.data && b.slots.length + b.slotsOcupados > 0);

		const bancasComVaga = bancasComSlots.filter((b) => b.slots.length > 0);

		if (bancasComSlots.length === 0) {
			setMessage({
				text: "Configure data, hora de início e fim com ao menos um slot de 30 min em cada banca.",
				severity: "warning",
			});
			return;
		}

		if (bancasComVaga.length === 0) {
			setMessage({
				text: "Todos os slots das bancas já estão ocupados por candidatos atribuídos.",
				severity: "warning",
			});
			return;
		}

		// Ignora pendências locais: redistribui quem ainda não está no servidor.
		const semAlocacao = embaralhar(
			candidatos.filter((c) => !sincronizadoNoServidor(c)),
		);
		if (semAlocacao.length === 0) {
			setMessage({
				text: "Todos os candidatos já possuem banca atribuída.",
				severity: "info",
			});
			return;
		}

		const capacidades = bancasComVaga.map((b) => b.slots.length);
		const totalSlotsLivres = capacidades.reduce((a, b) => a + b, 0);
		const quotas = calcularQuotas(semAlocacao.length, capacidades);

		const novaAtribuicao: Record<number, AtribuicaoPendente> = {};
		const compromissosBase = listarCompromissosAvaliadores().filter(
			(c) => !semAlocacao.some((cand) => cand.idInscricao === c.idInscricao),
		);
		const compromissosNovos: CompromissoAvaliador[] = [];
		let cursor = 0;
		let slotsIgnoradosPorChoque = 0;

		for (let i = 0; i < bancasComVaga.length; i++) {
			const { banca, slots } = bancasComVaga[i];
			const qtd = quotas[i];
			let alocadosNestaBanca = 0;

			for (const slot of slots) {
				if (alocadosNestaBanca >= qtd || cursor >= semAlocacao.length) {
					break;
				}
				const dataBancaIso = montarDataBanca(banca.data, slot);
				const inicioMs = new Date(dataBancaIso).getTime();
				const choque = encontrarChoqueHorario({
					codigosDocentes: banca.codigosDocentes,
					inicioMs,
					compromissos: [...compromissosBase, ...compromissosNovos],
				});
				if (choque) {
					slotsIgnoradosPorChoque++;
					continue;
				}

				const candidato = semAlocacao[cursor++];
				novaAtribuicao[candidato.idInscricao] = {
					codigosDocentes: [...banca.codigosDocentes].sort(),
					dataBanca: dataBancaIso,
				};
				for (const codigo of banca.codigosDocentes) {
					compromissosNovos.push({
						codigoDocente: codigo,
						nomeDocente: nomeDocente(codigo),
						idInscricao: candidato.idInscricao,
						nomeCandidato: candidato.nome,
						inicioMs,
					});
				}
				alocadosNestaBanca++;
			}
		}
		setAtribuicaoLocal(novaAtribuicao);

		const alocados = Object.keys(novaAtribuicao).length;
		const semSlot = semAlocacao.length - alocados;
		const detalheChoque =
			slotsIgnoradosPorChoque > 0
				? ` ${slotsIgnoradosPorChoque} slot(s) ignorado(s) por choque de horário do avaliador.`
				: "";
		setMessage({
			text:
				semSlot > 0
					? `${alocados} candidato(s) alocado(s) em ${totalSlotsLivres} slot(s) livre(s). ${semSlot} ficou(aram) sem alocação por falta de horários.${detalheChoque}`
					: `${alocados} candidato(s) alocado(s) igualmente entre ${bancasComVaga.length} banca(s).${detalheChoque}`,
			severity: semSlot > 0 || slotsIgnoradosPorChoque > 0 ? "warning" : "success",
		});
	};

	const distribuirRoundRobin = () => {
		const semBanca = embaralhar(
			candidatos.filter((c) => !sincronizadoNoServidor(c)),
		);
		if (semBanca.length === 0) {
			setMessage({
				text: "Todos os candidatos já possuem banca atribuída.",
				severity: "info",
			});
			return;
		}
		const novaAtribuicao: Record<number, AtribuicaoPendente> = {};
		semBanca.forEach((candidato, index) => {
			novaAtribuicao[candidato.idInscricao] = {
				codigosDocentes: [
					...bancas[index % bancas.length].codigosDocentes,
				].sort(),
			};
		});
		setAtribuicaoLocal(novaAtribuicao);
	};

	const executarDistribuicao = () => {
		if (mostrarPeriodo) {
			distribuirPorSlots();
		} else {
			distribuirRoundRobin();
		}
	};

	const distribuirAutomaticamente = () => {
		if (bancas.length === 0) return;
		if (contadorPendentes > 0) {
			setConfirmarRedistribuicao(true);
			return;
		}
		executarDistribuicao();
	};

	const confirmarERedistribuir = () => {
		setConfirmarRedistribuicao(false);
		executarDistribuicao();
	};

	const salvarAtribuicoes = async () => {
		if (mostrarPeriodo) {
			const compromissos = listarCompromissosAvaliadores();
			for (const [idStr, atrib] of Object.entries(atribuicaoLocal)) {
				const idInscricao = Number(idStr);
				const iso = atrib.dataBanca;
				if (!iso || atrib.codigosDocentes.length === 0) continue;
				const inicioMs = new Date(iso).getTime();
				if (Number.isNaN(inicioMs)) continue;
				const choque = encontrarChoqueHorario({
					codigosDocentes: atrib.codigosDocentes,
					inicioMs,
					compromissos,
					idInscricaoIgnorar: idInscricao,
				});
				if (choque) {
					setMessage({
						text: `Não foi possível sincronizar. ${mensagemChoqueHorario(choque)}`,
						severity: "error",
					});
					return;
				}
			}
		}

		const itens: AtribuicaoItem[] = Object.entries(atribuicaoLocal).map(
			([idInscricao, atrib]) => ({
				idInscricao: Number(idInscricao),
				codigosDocentes: atrib.codigosDocentes,
				...(atrib.dataBanca !== undefined
					? { dataBanca: atrib.dataBanca }
					: {}),
			}),
		);
		const resultado = await onSalvarAtribuicoes(itens);
		if (!resultado) return;
		setFalhas(resultado.falhas);
		if (resultado.falhas.length === 0) {
			setAtribuicaoLocal({});
			setMessage({
				text: `${resultado.sucesso.length} candidato(s) sincronizado(s) com sucesso.`,
				severity: "success",
			});
		} else {
			const idsComFalha = new Set(resultado.falhas.map((f) => f.idInscricao));
			setAtribuicaoLocal((prev) => {
				const next: Record<number, AtribuicaoPendente> = {};
				for (const [id, atrib] of Object.entries(prev)) {
					if (idsComFalha.has(Number(id))) next[Number(id)] = atrib;
				}
				return next;
			});
			setMessage({
				text: `${resultado.sucesso.length} atribuído(s), ${resultado.falhas.length} com pendência — veja os detalhes abaixo.`,
				severity: "warning",
			});
		}
	};

	const cancelarPendentes = () => {
		if (contadorPendentes === 0 || salvando) return;
		setAtribuicaoLocal({});
		setFalhas([]);
		setMessage({
			text: "Distribuição pendente cancelada. As bancas criadas foram mantidas.",
			severity: "info",
		});
	};

	const colunas = useMemo<GridColDef[]>(
		() => [
			{
				field: "cpf",
				headerName: "CPF",
				width: 140,
				renderCell: (params) => (
					<span style={{ fontFamily: "monospace", fontSize: 13 }}>
						{mascaraCpf(params.value as string)}
					</span>
				),
			},
			{
				field: "projetoPesquisa",
				headerName: "Título do projeto",
				flex: 1.5,
				minWidth: 200,
				renderCell: (params) =>
					params.value ? (
						params.value
					) : (
						<Typography
							variant="body2"
							color="text.disabled"
							sx={{ fontStyle: "italic" }}
						>
							Não informado
						</Typography>
					),
			},
			{
				field: "linhaPesquisa",
				headerName: "Linha de pesquisa",
				width: 180,
			},
			{
				field: "palavrasChave",
				headerName: "Palavras-chave",
				flex: 1,
				minWidth: 200,
				sortable: false,
				renderCell: (params) => {
					const palavras: string[] = params.value ?? [];
					if (palavras.length === 0) {
						return (
							<Typography
								variant="body2"
								color="text.disabled"
								sx={{ fontStyle: "italic" }}
							>
								Nenhuma
							</Typography>
						);
					}
					return (
						<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, py: 0.5 }}>
							{palavras.map((palavra) => (
								<Chip key={palavra} label={palavra} size="small" />
							))}
						</Box>
					);
				},
			},
			...(mostrarPeriodo
				? [
						{
							field: "dataBanca",
							headerName: "Data/horário da entrevista",
							flex: 0.9,
							minWidth: 220,
							sortable: true,
							valueGetter: (_value: unknown, row: CandidatoDistribuicao) =>
								dataBancaEfetiva(row) ?? "",
							renderCell: (params: { row: CandidatoDistribuicao }) => {
								const row = params.row;
								const pendente = row.idInscricao in atribuicaoLocal;
								const valor = dataBancaEfetiva(row);
								const pendenteSoSlot =
									pendente &&
									chaveDocentes(
										atribuicaoLocal[row.idInscricao].codigosDocentes,
									) ===
										chaveDocentes(
											row.docentesAtribuidos.map((d) => d.codigoDocente),
										);
								return (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.5,
											width: "100%",
										}}
									>
										<Typography
											variant="body2"
											sx={{
												flex: 1,
												minWidth: 0,
												color: pendente ? "warning.main" : "text.primary",
												fontStyle: valor ? "normal" : "italic",
											}}
										>
											{valor
												? formatarDataBanca(valor)
												: pendenteSoSlot
													? "Remoção pendente"
													: "Sem slot"}
										</Typography>
										<Tooltip title={valor ? "Editar slot" : "Incluir slot"}>
											<IconButton
												size="small"
												onClick={() => abrirDialogSlot(row)}
											>
												{valor ? (
													<EditIcon fontSize="small" />
												) : (
													<AddIcon fontSize="small" />
												)}
											</IconButton>
										</Tooltip>
										{valor && (
											<Tooltip title="Remover slot (mantém a banca)">
												<IconButton
													size="small"
													color="error"
													onClick={() => removerSlotCandidato(row)}
												>
													<DeleteIcon fontSize="small" />
												</IconButton>
											</Tooltip>
										)}
									</Box>
								);
							},
						} as GridColDef,
					]
				: []),
			{
				field: "docentesAtribuidos",
				headerName: "Avaliadores",
				flex: 1,
				minWidth: 220,
				sortable: false,
				renderCell: (params) => {
					const row = params.row as CandidatoDistribuicao;
					const pendente = row.idInscricao in atribuicaoLocal;
					const lista = docentesEfetivos(row);
					return (
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 0.5,
								py: 0.5,
								width: "100%",
							}}
						>
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									flex: 1,
									minWidth: 0,
								}}
							>
								{lista.length === 0 ? (
									<Typography
										variant="body2"
										color={pendente ? "warning.main" : "text.disabled"}
										sx={{ fontStyle: "italic" }}
									>
										{pendente ? "Remoção pendente" : "Nenhum atribuído"}
									</Typography>
								) : (
									lista.map((d) => (
										<Typography
											key={d.codigoDocente}
											variant="body2"
											sx={{
												color: d.temNotaLancada
													? "success.main"
													: pendente
														? "warning.main"
														: "text.primary",
												lineHeight: 1.4,
											}}
										>
											{d.nome}
										</Typography>
									))
								)}
							</Box>
							<Tooltip title="Editar avaliadores">
								<IconButton
									size="small"
									onClick={(e) => abrirMenuDocentes(e, row)}
								>
									<EditIcon fontSize="small" />
								</IconButton>
							</Tooltip>
							{lista.length > 0 && (
								<Tooltip
									title={
										row.docentesAtribuidos.some((d) => d.temNotaLancada)
											? "Não é possível remover: já existe nota lançada"
											: "Remover banca do candidato"
									}
								>
									<span>
										<IconButton
											size="small"
											color="error"
											disabled={row.docentesAtribuidos.some(
												(d) => d.temNotaLancada,
											)}
											onClick={() => removerAtribuicaoCandidato(row)}
										>
											<DeleteIcon fontSize="small" />
										</IconButton>
									</span>
								</Tooltip>
							)}
						</Box>
					);
				},
			},
		],
		[atribuicaoLocal, docentesDisponiveis, mostrarPeriodo],
	);

	const rows = candidatos.map((c) => ({ id: c.idInscricao, ...c }));

	const slotsForm = gerarHorariosSlots(form.horaInicio, form.horaFim);
	const docentesFormValidos =
		maximoDocentes !== null && quantidadeExata
			? form.codigosDocentes.length === maximoDocentes
			: maximoDocentes !== null
				? form.codigosDocentes.length > 0 &&
					form.codigosDocentes.length <= maximoDocentes
				: form.codigosDocentes.length > 0;
	const horariosFormValidos = !mostrarPeriodo
		? true
		: !!form.data &&
			!!form.horaInicio &&
			!!form.horaFim &&
			slotsForm.length > 0;
	const formValido =
		docentesFormValidos &&
		(!mostrarPeriodo || !!form.periodo) &&
		horariosFormValidos;

	return (
		<Box>
			<Card
				sx={{ backgroundColor: theme.palette.background.default, mb: 3 }}
			>
				<CardContent>
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
						<Typography variant="subtitle1">Bancas</Typography>
						<Button
							variant="contained"
							size="small"
							startIcon={<AddIcon />}
							onClick={abrirCriar}
						>
							Nova banca
						</Button>
					</Box>

					{bancas.length === 0 ? (
						<Typography variant="body2" color="text.secondary">
							Nenhuma banca criada. Crie ao menos uma banca para atribuir
							candidatos.
						</Typography>
					) : (
						<Stack
							direction="row"
							spacing={1.5}
							useFlexGap
							sx={{ flexWrap: "wrap" }}
						>
							{bancas.map((banca) => {
								const avaliadores = avaliadoresBancaOrdenados(
									banca,
									docentesDisponiveis,
								);
								const cabecalho = cabecalhoHorarioBanca(
									banca,
									primeiroSlotAtribuidoDaBanca(banca),
								);

								return (
									<Card
										key={banca.id}
										variant="outlined"
										sx={{
											minWidth: 200,
											maxWidth: 280,
										}}
									>
										<CardContent
											sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}
										>
											<Box
												sx={{
													display: "flex",
													alignItems: "flex-start",
													justifyContent: "space-between",
													gap: 0.5,
												}}
											>
												<Box sx={{ minWidth: 0, flex: 1 }}>
													{mostrarPeriodo && (
														<Typography
															variant="body2"
															sx={{ fontWeight: 600, mb: 0.75 }}
														>
															{cabecalho}
														</Typography>
													)}
													{avaliadores.length === 0 ? (
														<Typography
															variant="body2"
															color="text.secondary"
															sx={{ fontStyle: "italic" }}
														>
															Sem avaliadores
														</Typography>
													) : (
														avaliadores.map((avaliador) => (
															<Typography
																key={avaliador.codigo}
																variant="body2"
																sx={{ lineHeight: 1.45 }}
															>
																{avaliador.nome}
															</Typography>
														))
													)}
												</Box>
												<Box sx={{ display: "flex", flexShrink: 0 }}>
													<Tooltip title="Editar banca">
														<IconButton
															size="small"
															aria-label="Editar banca"
															sx={iconButtonSx}
															onClick={() => abrirEditar(banca)}
														>
															<EditIcon fontSize="small" />
														</IconButton>
													</Tooltip>
													<Tooltip title="Remover banca">
														<IconButton
															size="small"
															aria-label="Remover banca"
															sx={iconButtonSx}
															onClick={() => setConfirmarRemocao(banca)}
														>
															<DeleteIcon fontSize="small" />
														</IconButton>
													</Tooltip>
												</Box>
											</Box>
										</CardContent>
									</Card>
								);
							})}
						</Stack>
					)}
				</CardContent>
			</Card>

			{erro && (
				<Alert severity="error" sx={{ mb: 2 }}>
					{erro}
				</Alert>
			)}

			{falhas.length > 0 && (
				<Alert severity="warning" sx={{ mb: 2 }} onClose={() => setFalhas([])}>
					<Typography variant="body2" sx={{ fontWeight: 600 }}>
						Pendências:
					</Typography>
					{falhas.map((f) => (
						<Typography key={f.idInscricao} variant="body2">
							Inscrição {f.idInscricao}: {f.motivo}
						</Typography>
					))}
				</Alert>
			)}

			<Card sx={{ backgroundColor: theme.palette.background.default }}>
				<CardContent
					sx={{ display: "flex", flexDirection: "column", height: "100%" }}
				>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							mb: 1,
							flexWrap: "wrap",
							gap: 1,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Typography variant="subtitle1">Candidatos</Typography>
							<Chip
								label={`${candidatos.length} candidato${candidatos.length !== 1 ? "s" : ""}`}
								size="small"
								color="primary"
								variant="outlined"
							/>
						</Box>
						<Stack direction="row" spacing={1}>
							<Tooltip
								title={
									todosSincronizados
										? "Todos os candidatos já possuem banca sincronizada"
										: bancas.length === 0
											? "Crie ao menos uma banca para distribuir"
											: contadorPendentes > 0
												? "Há atribuições locais não sincronizadas — será pedida confirmação para redistribuir"
												: mostrarPeriodo
													? "Distribui candidatos em slots de 30 min conforme horário das bancas"
													: ""
								}
							>
								<span>
									<Button
										variant="outlined"
										size="small"
										startIcon={<ShuffleIcon />}
										onClick={distribuirAutomaticamente}
										disabled={
											bancas.length === 0 ||
											candidatos.length === 0 ||
											todosSincronizados
										}
									>
										Distribuir automaticamente
									</Button>
								</span>
							</Tooltip>
							<Tooltip
								title={
									contadorPendentes === 0
										? "Nenhuma atribuição pendente"
										: `${contadorPendentes} pendente(s)`
								}
							>
								<span>
									<Badge badgeContent={contadorPendentes} color="warning" max={99}>
										<Button
											variant="contained"
											size="small"
											startIcon={
												salvando ? (
													<CircularProgress size={14} color="inherit" />
												) : (
													<SyncIcon />
												)
											}
											onClick={salvarAtribuicoes}
											disabled={contadorPendentes === 0 || salvando}
										>
											Sincronizar
										</Button>
									</Badge>
								</span>
							</Tooltip>
							<Tooltip
								title={
									contadorPendentes === 0
										? "Nenhuma atribuição pendente para cancelar"
										: "Descarta a distribuição local e mantém as bancas criadas"
								}
							>
								<span>
									<Button
										variant="outlined"
										color="inherit"
										size="small"
										onClick={cancelarPendentes}
										disabled={contadorPendentes === 0 || salvando}
									>
										Cancelar
									</Button>
								</span>
							</Tooltip>
						</Stack>
					</Box>

					{candidatos.length === 0 ? (
						<Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
							Nenhum candidato homologado neste edital.
						</Typography>
					) : (
						<Box sx={{ flex: 1, minHeight: 400 }}>
							<CustomDataGrid
								rows={rows}
								columns={colunas}
								pageSize={Math.max(rows.length, 1)}
								pageSizeOptions={[Math.max(rows.length, 1)]}
								hideFooter
								getRowId={(row) => row.id}
								getRowHeight={() => "auto"}
								slots={{ toolbar: BarraBusca }}
								sx={{
									...dataGridBgSx(theme.palette.background.default),
									"& .MuiDataGrid-cell": { alignItems: "flex-start", py: 1 },
								}}
							/>
						</Box>
					)}
				</CardContent>
			</Card>

			<MenuAtribuicaoDocentes
				anchorEl={menuDocentesAncora}
				candidato={candidatoSelecionado}
				docentesDisponiveis={docentesDisponiveis}
				maximoDocentes={maximoDocentes}
				quantidadeExata={quantidadeExata}
				onClose={fecharMenuDocentes}
				onAplicar={handleAplicarDocentes}
			/>

			<Dialog open={dialogAberto} onClose={fecharDialog} maxWidth="sm" fullWidth>
				<DialogTitle>{bancaEditando ? "Editar banca" : "Nova banca"}</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						{mostrarPeriodo && (
							<FormControl fullWidth size="small">
								<InputLabel>Período</InputLabel>
								<Select
									value={form.periodo ?? "MANHA"}
									label="Período"
									onChange={(e) =>
										atualizarFormBanca({
											periodo: e.target.value as Periodo,
										})
									}
								>
									{(Object.keys(LABEL_PERIODO) as Periodo[]).map((p) => (
										<MenuItem key={p} value={p}>
											{LABEL_PERIODO[p]}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}

						<TextField
							label="Data"
							type="date"
							size="small"
							slotProps={{ inputLabel: { shrink: true } }}
							value={form.data}
							onChange={(e) => atualizarFormBanca({ data: e.target.value })}
							fullWidth
							required={mostrarPeriodo}
						/>

						{mostrarPeriodo && (
							<>
								<Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
									<TextField
										label="Hora de início"
										type="time"
										size="small"
										slotProps={{ inputLabel: { shrink: true } }}
										value={form.horaInicio}
										onChange={(e) =>
											atualizarFormBanca({ horaInicio: e.target.value })
										}
										fullWidth
										required
									/>
									<TextField
										label="Hora de fim"
										type="time"
										size="small"
										slotProps={{ inputLabel: { shrink: true } }}
										value={form.horaFim}
										onChange={(e) =>
											atualizarFormBanca({ horaFim: e.target.value })
										}
										fullWidth
										required
									/>
								</Stack>
								{form.horaInicio && form.horaFim && (
									<Typography variant="caption" color="text.secondary">
										{slotsForm.length > 0
											? `${slotsForm.length} slot(s) de ${DURACAO_SLOT_MIN} min: ${slotsForm.join(", ")}`
											: "Intervalo inválido: é necessário ao menos um slot de 30 minutos."}
									</Typography>
								)}
							</>
						)}

						<FormControl fullWidth size="small">
							<InputLabel id="docentes-banca-label">
								{maximoDocentes !== null && quantidadeExata
									? `Docentes * (${maximoDocentes})`
									: "Docentes *"}
							</InputLabel>
							<Select
								labelId="docentes-banca-label"
								label={
									maximoDocentes !== null && quantidadeExata
										? `Docentes * (${maximoDocentes})`
										: "Docentes *"
								}
								multiple
								value={form.codigosDocentes}
								onChange={(e) => {
									const selecionados = e.target.value as string[];
									if (
										maximoDocentes !== null &&
										selecionados.length > maximoDocentes
									) {
										return;
									}
									atualizarFormBanca({ codigosDocentes: selecionados });
								}}
								input={
									<OutlinedInput
										label={
											maximoDocentes !== null && quantidadeExata
												? `Docentes * (${maximoDocentes})`
												: "Docentes *"
										}
									/>
								}
								renderValue={(selecionados) => (
									<Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
										{(selecionados as string[]).map((codigo) => {
											const mensagemChoque = choquesBancaPorDocente[codigo];
											const nome =
												docentesDisponiveis.find((d) => d.codigo === codigo)
													?.nome ?? codigo;
											return (
												<Tooltip key={codigo} title={mensagemChoque ?? ""}>
													<Chip
														label={nome}
														size="small"
														color={mensagemChoque ? "warning" : "default"}
														icon={
															mensagemChoque ? (
																<WarningAmberIcon />
															) : undefined
														}
													/>
												</Tooltip>
											);
										})}
									</Box>
								)}
							>
								{docentesDisponiveis.map((docente) => {
									const selecionado = form.codigosDocentes.includes(
										docente.codigo,
									);
									const desabilitado =
										!selecionado &&
										maximoDocentes !== null &&
										form.codigosDocentes.length >= maximoDocentes;
									const mensagemChoque =
										choquesBancaPorDocente[docente.codigo];
									return (
										<MenuItem
											key={docente.codigo}
											value={docente.codigo}
											disabled={desabilitado}
										>
											<Checkbox
												checked={selecionado}
												size="small"
												disableRipple
												tabIndex={-1}
											/>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 0.75,
													flex: 1,
												}}
											>
												<span>{docente.nome}</span>
												{mensagemChoque && (
													<Tooltip title={mensagemChoque}>
														<WarningAmberIcon
															fontSize="small"
															color="warning"
															aria-label="Choque de horário"
														/>
													</Tooltip>
												)}
											</Box>
										</MenuItem>
									);
								})}
							</Select>
							{Object.keys(choquesBancaPorDocente).length > 0 && (
								<Typography
									variant="caption"
									color="warning.main"
									sx={{ mt: 0.75, display: "block" }}
								>
									Há docente(s) com choque de horário nesta banca.
								</Typography>
							)}
						</FormControl>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={fecharDialog} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={salvarBanca}
						variant="contained"
						disabled={!formValido}
					>
						{bancaEditando ? "Salvar" : "Criar"}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={Boolean(confirmarRemocao)} onClose={() => setConfirmarRemocao(null)}>
				<DialogTitle>Remover banca</DialogTitle>
				<DialogContent>
					<Typography>
						Deseja remover esta banca? Os candidatos atribuídos a ela ficarão
						sem banca localmente. Use Sincronizar para efetivar a remoção no
						servidor.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setConfirmarRemocao(null)} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={() => confirmarRemocao && removerBanca(confirmarRemocao)}
						color="error"
						variant="contained"
					>
						Remover
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={confirmarRedistribuicao}
				onClose={() => setConfirmarRedistribuicao(false)}
			>
				<DialogTitle>Redistribuir candidatos</DialogTitle>
				<DialogContent>
					<Typography>
						Existem {contadorPendentes} atribuição(ões) local(is) ainda não
						sincronizada(s). Ao continuar, essas atribuições serão descartadas e
						os candidatos serão redistribuídos aleatoriamente. Deseja continuar?
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setConfirmarRedistribuicao(false)}
						color="inherit"
					>
						Cancelar
					</Button>
					<Button
						onClick={confirmarERedistribuir}
						variant="contained"
						color="warning"
					>
						Redistribuir
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog
				open={dialogSlotAberto}
				onClose={fecharDialogSlot}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>
					{slotJaExistia ? "Editar slot" : "Incluir slot"}
				</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						{candidatoSlot && (
							<Typography variant="body2" color="text.secondary">
								{candidatoSlot.nome}
							</Typography>
						)}
						<TextField
							label="Data"
							type="date"
							size="small"
							slotProps={{ inputLabel: { shrink: true } }}
							value={formSlot.data}
							onChange={(e) =>
								setFormSlot((prev) => ({ ...prev, data: e.target.value }))
							}
							fullWidth
							required
						/>
						<TextField
							label="Horário de início"
							type="time"
							size="small"
							slotProps={{ inputLabel: { shrink: true } }}
							value={formSlot.hora}
							onChange={(e) =>
								setFormSlot((prev) => ({ ...prev, hora: e.target.value }))
							}
							fullWidth
							required
						/>
						<Typography variant="caption" color="text.secondary">
							O slot pode ser definido independentemente da banca. Use
							Sincronizar para confirmar ou Cancelar para desfazer.
						</Typography>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={fecharDialogSlot} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={salvarSlotCandidato}
						variant="contained"
						disabled={!formSlot.data || !formSlot.hora}
					>
						Salvar
					</Button>
				</DialogActions>
			</Dialog>

			<Snackbar
				open={!!message}
				autoHideDuration={4000}
				onClose={() => setMessage(null)}
			>
				<Alert severity={message?.severity ?? "info"} onClose={() => setMessage(null)}>
					{message?.text}
				</Alert>
			</Snackbar>
		</Box>
	);
}
