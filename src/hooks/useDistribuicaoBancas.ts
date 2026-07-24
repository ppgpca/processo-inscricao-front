import { useCallback, useEffect, useState } from "react";
import { distribuicaoService } from "../services/distribuicao.service";
import type {
	AtribuicaoItem,
	CandidatoDistribuicao,
	DocenteDistribuicao,
	NomeEtapaDistribuicao,
} from "../types";

export function useDistribuicaoBancas(
	idEdital: number | "",
	nomeEtapa: NomeEtapaDistribuicao,
) {
	const [candidatos, setCandidatos] = useState<CandidatoDistribuicao[]>([]);
	const [docentes, setDocentes] = useState<DocenteDistribuicao[]>([]);
	const [loading, setLoading] = useState(false);
	const [erro, setErro] = useState<string | null>(null);
	const [salvando, setSalvando] = useState(false);

	const recarregar = useCallback(
		async (opcoes?: { silencioso?: boolean }) => {
			if (!idEdital) {
				setCandidatos([]);
				setDocentes([]);
				return;
			}
			if (!opcoes?.silencioso) setLoading(true);
			setErro(null);
			try {
				const [listaCandidatos, listaDocentes] = await Promise.all([
					distribuicaoService.findCandidatos(idEdital, nomeEtapa),
					distribuicaoService.findDocentes(idEdital, nomeEtapa),
				]);
				setCandidatos(listaCandidatos);
				setDocentes(listaDocentes);
			} catch {
				setErro("Não foi possível carregar os candidatos e docentes.");
			} finally {
				if (!opcoes?.silencioso) setLoading(false);
			}
		},
		[idEdital, nomeEtapa],
	);

	useEffect(() => {
		recarregar();
	}, [recarregar]);

	const salvarAtribuicoes = async (itens: AtribuicaoItem[]) => {
		if (!idEdital || itens.length === 0) return;
		setSalvando(true);
		setErro(null);
		try {
			const resultado = await distribuicaoService.atribuir(
				idEdital,
				nomeEtapa,
				itens,
			);
			await recarregar({ silencioso: true });
			return resultado;
		} catch {
			setErro("Falha ao sincronizar as atribuições. Tente novamente.");
		} finally {
			setSalvando(false);
		}
	};

	return {
		candidatos,
		docentes,
		loading,
		erro,
		salvando,
		recarregar,
		salvarAtribuicoes,
	};
}
