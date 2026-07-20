import { useCallback, useEffect, useState } from "react";
import { distribuicaoService } from "../services/distribuicao.service";
import type {
	AtribuicaoItem,
	CandidatoDistribuicao,
	DocenteDistribuicao,
} from "../types";

export function useDistribuicaoAnteprojeto(idEdital: number | "") {
	const [candidatos, setCandidatos] = useState<CandidatoDistribuicao[]>([]);
	const [docentes, setDocentes] = useState<DocenteDistribuicao[]>([]);
	const [loading, setLoading] = useState(false);
	const [erro, setErro] = useState<string | null>(null);
	const [distribuindo, setDistribuindo] = useState(false);
	const [sincronizando, setSincronizando] = useState(false);

	const recarregar = useCallback(async () => {
		if (!idEdital) {
			setCandidatos([]);
			setDocentes([]);
			return;
		}
		setLoading(true);
		setErro(null);
		try {
			const [listaCandidatos, listaDocentes] = await Promise.all([
				distribuicaoService.findCandidatos(idEdital, "ANTEPROJETO"),
				distribuicaoService.findDocentes(idEdital, "ANTEPROJETO"),
			]);
			setCandidatos(listaCandidatos);
			setDocentes(listaDocentes);
		} catch {
			setErro("Não foi possível carregar os candidatos e docentes.");
		} finally {
			setLoading(false);
		}
	}, [idEdital]);

	useEffect(() => {
		recarregar();
	}, [recarregar]);

	const proporDistribuicaoAutomatica = async (): Promise<
		AtribuicaoItem[] | undefined
	> => {
		if (!idEdital) return;
		setDistribuindo(true);
		setErro(null);
		try {
			return await distribuicaoService.proporDistribuicaoAnteprojeto(idEdital);
		} catch {
			setErro("Falha ao distribuir automaticamente. Tente novamente.");
		} finally {
			setDistribuindo(false);
		}
	};

	const sincronizarAtribuicoes = async (itens: AtribuicaoItem[]) => {
		if (!idEdital || itens.length === 0) return;
		setSincronizando(true);
		setErro(null);
		try {
			const resultado = await distribuicaoService.atribuir(
				idEdital,
				"ANTEPROJETO",
				itens,
			);
			await recarregar();
			return resultado;
		} catch {
			setErro("Falha ao sincronizar as atribuições. Tente novamente.");
		} finally {
			setSincronizando(false);
		}
	};

	return {
		candidatos,
		docentes,
		loading,
		erro,
		distribuindo,
		sincronizando,
		recarregar,
		proporDistribuicaoAutomatica,
		sincronizarAtribuicoes,
	};
}
