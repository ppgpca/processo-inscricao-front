import { useCallback, useState } from "react";
import type {
	Candidato,
	DadosComplementares,
	DadosPessoais,
	Edital,
	Inscricao,
	ProjetoPesquisa,
	AppMessage,
} from "../types";
import { candidatoService } from "../services/candidato.service";
import { inscricaoService } from "../services/inscricao.service";
import {
	carregarDadosPessoaisExistentes,
	getInitialDadosPessoais,
} from "../controllers/dados-pessoais-controller";
import {
	carregarDadosComplementares,
	getInitialDadosComplementares,
} from "../controllers/formacao-controller";
import {
	carregarProjetoPesquisaExistente,
	getInitialProjetoPesquisa,
} from "../controllers/projeto-pesquisa-controller";
import {
	obterStepParaContinuar,
	prepararPayloadEtapa2,
	prepararPayloadEtapa3,
	prepararPayloadFinalizacao,
	obterFonteDadosComplementares,
} from "../controllers/inscricao-controller";
import { prepararPayloadCandidato } from "../controllers/dados-pessoais-controller";

export function useInscricao(edital: Edital | null) {
	const [activeStep, setActiveStep] = useState(0);
	const [cpf, setCpf] = useState("");
	const [inscricao, setInscricao] = useState<Inscricao | null>(null);
	const [candidato, setCandidato] = useState<Candidato | null>(null);
	const [inscricaoHistorico, setInscricaoHistorico] =
		useState<Inscricao | null>(null);
	const [dadosPessoais, setDadosPessoais] = useState<DadosPessoais>(
		getInitialDadosPessoais,
	);
	const [dadosComplementares, setDadosComplementares] =
		useState<DadosComplementares>(getInitialDadosComplementares);
	const [projetoPesquisa, setProjetoPesquisa] = useState<ProjetoPesquisa>(
		getInitialProjetoPesquisa,
	);
	const [saving, setSaving] = useState(false);
	const [inscricaoEnviada, setInscricaoEnviada] = useState(false);
	const [message, setMessage] = useState<AppMessage | null>(null);

	const showMessage = (
		text: string,
		severity: AppMessage["severity"] = "success",
	) => {
		setMessage({ text, severity });
	};

	const carregarDadosExistentes = useCallback(
		(insc: Inscricao, cand: Candidato | null) => {
			if (cand) {
				setDadosPessoais(carregarDadosPessoaisExistentes(cand));
			}

			if (insc.dadosComplementares) {
				setDadosComplementares(
					carregarDadosComplementares(insc.dadosComplementares),
				);
			}

			setProjetoPesquisa(carregarProjetoPesquisaExistente(insc));
		},
		[],
	);

	const handleCpfSubmit = useCallback(
		async (cpfInformado: string) => {
			if (!edital) throw new Error("Nenhum edital vigente encontrado.");
			setCpf(cpfInformado);

			const [inscricaoExistente, candidatoExistente] = await Promise.all([
				inscricaoService.findByCpfEdital(cpfInformado, edital.id),
				candidatoService.findByCpf(cpfInformado),
			]);

			let inscricaoHistoricoEncontrada: Inscricao | null = null;
			if (candidatoExistente) {
				setCandidato(candidatoExistente);
				inscricaoHistoricoEncontrada = await inscricaoService
					.findMaisRecentePorCpf(cpfInformado)
					.catch(() => null);
				setInscricaoHistorico(inscricaoHistoricoEncontrada);
			}

			if (inscricaoExistente) {
				setInscricao(inscricaoExistente);
				carregarDadosExistentes(inscricaoExistente, candidatoExistente);
			}

			return {
				inscricaoExistente,
				candidatoExistente,
				inscricaoHistorico: inscricaoHistoricoEncontrada,
			};
		},
		[edital, carregarDadosExistentes],
	);

	const continuarInscricaoExistente = useCallback(
		(insc: Inscricao, cand: Candidato | null) => {
			setInscricao(insc);
			if (cand) setCandidato(cand);
			carregarDadosExistentes(insc, cand);

			if (insc.status === "enviada" || (insc.etapa ?? 0) >= 5) {
				setInscricaoEnviada(true);
				return;
			}

			setActiveStep(obterStepParaContinuar(insc.etapa));
		},
		[carregarDadosExistentes],
	);

	const editarInscricaoExistente = useCallback(
		(insc: Inscricao, cand: Candidato | null) => {
			setInscricao(insc);
			if (cand) setCandidato(cand);
			carregarDadosExistentes(insc, cand);
			setActiveStep(4);
		},
		[carregarDadosExistentes],
	);

	const iniciarNovaInscricao = useCallback(
		async (
			inscricaoAnterior: Inscricao | null,
			candExistente: Candidato | null,
			inscricaoHistoricoParam: Inscricao | null,
		) => {
			if (!edital) throw new Error("Nenhum edital vigente encontrado.");

			if (inscricaoAnterior) {
				await inscricaoService.desativar(inscricaoAnterior.id);
			}

			if (candExistente) {
				setDadosPessoais(
					carregarDadosPessoaisExistentes(candExistente),
				);
				setCandidato(candExistente);
			}

			const fonteDc = obterFonteDadosComplementares(
				inscricaoAnterior,
				inscricaoHistoricoParam ?? inscricaoHistorico,
			);
			setDadosComplementares(carregarDadosComplementares(fonteDc));

			setProjetoPesquisa(getInitialProjetoPesquisa());
			setInscricao(null);
			setActiveStep(1);
		},
		[edital, inscricaoHistorico],
	);

	const salvarEtapa2 = useCallback(async () => {
		if (!edital) return;
		setSaving(true);
		try {
			const candSalvo = await candidatoService.upsert(
				prepararPayloadCandidato(cpf, dadosPessoais),
			);
			setCandidato(candSalvo);

			const payload = prepararPayloadEtapa2(
				cpf,
				edital,
				projetoPesquisa,
				inscricao,
			);
			let inscricaoAtualizada: Inscricao;
			if (payload.update) {
				inscricaoAtualizada = await inscricaoService.update(
					payload.id!,
					payload.dados,
				);
			} else {
				inscricaoAtualizada = await inscricaoService.create(
					payload.dados as Partial<Inscricao>,
				);
			}
			setInscricao(inscricaoAtualizada);
			setActiveStep(3);
			showMessage("Dados pessoais salvos com sucesso!", "success");
		} catch {
			showMessage("Erro ao salvar dados pessoais.", "error");
		} finally {
			setSaving(false);
		}
	}, [cpf, dadosPessoais, edital, inscricao, projetoPesquisa]);

	const salvarEtapa3 = useCallback(async () => {
		if (!inscricao || !edital) return;
		setSaving(true);
		try {
			const atualizada = await inscricaoService.update(
				inscricao.id,
				prepararPayloadEtapa3(edital, dadosComplementares),
			);
			setInscricao(atualizada);
			setActiveStep(4);
			showMessage("Dados de formação salvos com sucesso!", "success");
		} catch {
			showMessage("Erro ao salvar dados de formação.", "error");
		} finally {
			setSaving(false);
		}
	}, [dadosComplementares, edital, inscricao]);

	const finalizarInscricao = useCallback(async (): Promise<boolean> => {
		if (!inscricao || !edital) return false;
		setSaving(true);
		try {
			const atualizada = await inscricaoService.update(
				inscricao.id,
				prepararPayloadFinalizacao(edital),
			);
			setInscricao(atualizada);
			setInscricaoEnviada(true);
			return true;
		} catch {
			showMessage(
				"Erro ao finalizar inscrição. Tente novamente.",
				"error",
			);
			return false;
		} finally {
			setSaving(false);
		}
	}, [edital, inscricao]);

	const voltarEtapa = useCallback(() => {
		setActiveStep((prev) => Math.max(0, prev - 1));
	}, []);

	const reiniciar = useCallback(() => {
		setActiveStep(0);
		setCpf("");
		setInscricao(null);
		setCandidato(null);
		setInscricaoHistorico(null);
		setDadosPessoais(getInitialDadosPessoais());
		setDadosComplementares(getInitialDadosComplementares());
		setProjetoPesquisa(getInitialProjetoPesquisa());
		setInscricaoEnviada(false);
		setMessage(null);
	}, []);

	return {
		activeStep,
		setActiveStep,
		cpf,
		setCpf,
		inscricao,
		candidato,
		dadosPessoais,
		setDadosPessoais,
		dadosComplementares,
		setDadosComplementares,
		projetoPesquisa,
		setProjetoPesquisa,
		saving,
		inscricaoEnviada,
		message,
		setMessage,
		showMessage,
		handleCpfSubmit,
		continuarInscricaoExistente,
		editarInscricaoExistente,
		iniciarNovaInscricao,
		salvarEtapa2,
		salvarEtapa3,
		finalizarInscricao,
		voltarEtapa,
		reiniciar,
		carregarDadosExistentes,
	};
}
