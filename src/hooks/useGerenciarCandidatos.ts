import { useState, useEffect } from "react";
import { useLocation } from "react-router";
import { dashboardService } from "../services/dashboard.service";
import { editalService } from "../services/edital.service";
import { inscricaoService } from "../services/inscricao.service";
import type { Edital, InscritoDashboard } from "../types";

export function useGerenciarCandidatos() {
	const location = useLocation();
	const idEditalRetorno =
		(location.state as { idEdital?: number } | null)?.idEdital ?? null;

	const [editais, setEditais] = useState<Edital[]>([]);
	const [editalSelecionado, setEditalSelecionado] = useState<number | "">("");
	const [inscritos, setInscritos] = useState<InscritoDashboard[]>([]);
	const [loading, setLoading] = useState(false);
	const [loadingEditais, setLoadingEditais] = useState(true);
	const [erro, setErro] = useState<string | null>(null);

	/**
	 * Alterações feitas localmente ainda não enviadas à API.
	 * Chave = idInscricao, valor = novo valor de deferida.
	 */
	const [alteracoesPendentes, setAlteracoesPendentes] = useState<
		Record<number, boolean>
	>({});
	const [sincronizando, setSincronizando] = useState(false);

	const contadorPendentes = Object.keys(alteracoesPendentes).length;

	useEffect(() => {
		const carregarEditais = async () => {
			setLoadingEditais(true);
			try {
				const lista = await editalService.findAll();
				setEditais(lista);

				if (idEditalRetorno && lista.some((e) => e.id === idEditalRetorno)) {
					setEditalSelecionado(idEditalRetorno);
					return;
				}

				const agora = new Date();
				const emAvaliacao = lista.find((e) => {
					const etapa = e.etapas?.find(
						(et) => et.sigla === "ANALISE_CURRICULO",
					);
					if (!etapa?.dataInicio || !etapa?.dataFim) return false;
					return (
						new Date(etapa.dataInicio) <= agora &&
						agora <= new Date(etapa.dataFim)
					);
				});
				if (emAvaliacao) {
					setEditalSelecionado(emAvaliacao.id);
				}
			} catch {
				setErro("Não foi possível carregar os editais.");
			} finally {
				setLoadingEditais(false);
			}
		};
		carregarEditais();
	}, [idEditalRetorno]);

	useEffect(() => {
		if (!editalSelecionado) {
			setInscritos([]);
			setAlteracoesPendentes({});
			return;
		}
		const carregarInscritos = async () => {
			setLoading(true);
			setErro(null);
			setAlteracoesPendentes({});
			try {
				const dados = await dashboardService.obterDados(
					Number(editalSelecionado),
				);
				setInscritos(dados.inscritos ?? []);
			} catch {
				setErro("Não foi possível carregar os candidatos.");
			} finally {
				setLoading(false);
			}
		};
		carregarInscritos();
	}, [editalSelecionado]);

	/**
	 * Marca uma alteração local de deferida. Se o valor novo for igual ao valor
	 * já salvo na API, a alteração é removida das pendentes (revertida).
	 */
	const marcarDeferida = (idInscricao: number, novoValor: boolean) => {
		const original = inscritos.find((i) => i.idInscricao === idInscricao);
		if (original?.deferida === novoValor) {
			setAlteracoesPendentes((prev) => {
				const next = { ...prev };
				delete next[idInscricao];
				return next;
			});
		} else {
			setAlteracoesPendentes((prev) => ({
				...prev,
				[idInscricao]: novoValor,
			}));
		}
	};

	/**
	 * Aplica o mesmo valor de deferida a vários candidatos de uma vez.
	 */
	const marcarDeferidaEmLote = (
		idsInscricao: number[],
		novoValor: boolean,
	) => {
		if (idsInscricao.length === 0) return;

		const originaisPorId = new Map(
			inscritos.map((i) => [i.idInscricao, i.deferida]),
		);

		setAlteracoesPendentes((prev) => {
			const next = { ...prev };
			for (const id of idsInscricao) {
				if (originaisPorId.get(id) === novoValor) {
					delete next[id];
				} else {
					next[id] = novoValor;
				}
			}
			return next;
		});
	};

	/**
	 * Envia todas as alterações pendentes para a API em paralelo,
	 * atualiza o estado local e limpa as pendências.
	 */
	const sincronizar = async () => {
		if (contadorPendentes === 0 || sincronizando) return;
		setSincronizando(true);
		setErro(null);
		try {
			await Promise.all(
				Object.entries(alteracoesPendentes).map(([id, valor]) =>
					inscricaoService.update(Number(id), { deferida: valor }),
				),
			);
			setInscritos((prev) =>
				prev.map((i) =>
					i.idInscricao in alteracoesPendentes
						? { ...i, deferida: alteracoesPendentes[i.idInscricao] }
						: i,
				),
			);
			setAlteracoesPendentes({});
		} catch {
			setErro("Falha ao sincronizar. Verifique sua conexão e tente novamente.");
		} finally {
			setSincronizando(false);
		}
	};

	return {
		editais,
		editalSelecionado,
		setEditalSelecionado,
		inscritos,
		loading,
		loadingEditais,
		erro,
		alteracoesPendentes,
		contadorPendentes,
		sincronizando,
		marcarDeferida,
		marcarDeferidaEmLote,
		sincronizar,
	};
}
