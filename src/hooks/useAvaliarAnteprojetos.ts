import { useEffect, useState } from "react";
import { docenteService } from "../services/docente.service";
import type { CandidatoAvaliacao, CriterioAvaliacao, Edital } from "../types";

export function useAvaliarAnteprojetos() {
	const [editais, setEditais] = useState<Edital[]>([]);
	const [editalSelecionado, setEditalSelecionado] = useState<number | "">("");
	const [criterios, setCriterios] = useState<CriterioAvaliacao[]>([]);
	const [criterioSelecionado, setCriterioSelecionado] = useState<number | "">(
		"",
	);
	const [candidatos, setCandidatos] = useState<CandidatoAvaliacao[]>([]);
	const [loadingEditais, setLoadingEditais] = useState(true);
	const [loadingCriterios, setLoadingCriterios] = useState(false);
	const [loadingCandidatos, setLoadingCandidatos] = useState(false);
	const [erro, setErro] = useState<string | null>(null);

	useEffect(() => {
		const carregarEditais = async () => {
			setLoadingEditais(true);
			try {
				const lista = await docenteService.findEditaisComoAvaliador();
				setEditais(lista);

				// Auto-seleciona o edital cujo período de avaliação está vigente
				const agora = new Date();
				const emAvaliacao = lista.find((e) => {
					if (!e.dataInicioAvaliacao || !e.dataFimAvaliacao) return false;
					return (
						new Date(e.dataInicioAvaliacao) <= agora &&
						agora <= new Date(e.dataFimAvaliacao)
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
	}, []);

	useEffect(() => {
		if (!editalSelecionado) {
			setCriterios([]);
			setCriterioSelecionado("");
			setCandidatos([]);
			return;
		}
		const carregarCriterios = async () => {
			setLoadingCriterios(true);
			setErro(null);
			setCriterioSelecionado("");
			setCandidatos([]);
			try {
				const lista = await docenteService.findCriteriosByEdital(
					Number(editalSelecionado),
				);
				setCriterios(lista);
			} catch {
				setErro("Não foi possível carregar os critérios de avaliação.");
			} finally {
				setLoadingCriterios(false);
			}
		};
		carregarCriterios();
	}, [editalSelecionado]);

	useEffect(() => {
		if (!criterioSelecionado) {
			setCandidatos([]);
			return;
		}
		const carregarCandidatos = async () => {
			setLoadingCandidatos(true);
			setErro(null);
			try {
				const lista = await docenteService.findCandidatosParaAvaliar(
					Number(criterioSelecionado),
				);
				setCandidatos(lista);
			} catch {
				setErro("Não foi possível carregar os candidatos.");
			} finally {
				setLoadingCandidatos(false);
			}
		};
		carregarCandidatos();
	}, [criterioSelecionado]);

	return {
		editais,
		editalSelecionado,
		setEditalSelecionado,
		criterios,
		criterioSelecionado,
		setCriterioSelecionado,
		candidatos,
		loadingEditais,
		loadingCriterios,
		loadingCandidatos,
		erro,
	};
}
