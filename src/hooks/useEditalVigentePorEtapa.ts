import { useEffect, useState } from "react";
import { editalService } from "../services/edital.service";
import type { Edital, NomeEtapa } from "../types";

export function useEditalVigentePorEtapa(nomeEtapa: NomeEtapa) {
	const [editais, setEditais] = useState<Edital[]>([]);
	const [editalSelecionado, setEditalSelecionado] = useState<number | "">("");
	const [loadingEditais, setLoadingEditais] = useState(true);
	const [erro, setErro] = useState<string | null>(null);

	useEffect(() => {
		const carregar = async () => {
			setLoadingEditais(true);
			setErro(null);
			try {
				const lista = await editalService.findAll();
				setEditais(lista);

				const agora = new Date();
				const vigente = lista.find((e) => {
					const etapa = e.etapas?.find((et) => et.nome === nomeEtapa);
					if (!etapa?.dataInicio || !etapa?.dataFim) return false;
					return (
						new Date(etapa.dataInicio) <= agora &&
						agora <= new Date(etapa.dataFim)
					);
				});
				if (vigente) setEditalSelecionado(vigente.id);
			} catch {
				setErro("Não foi possível carregar os editais.");
			} finally {
				setLoadingEditais(false);
			}
		};
		carregar();
	}, [nomeEtapa]);

	return {
		editais,
		editalSelecionado,
		setEditalSelecionado,
		loadingEditais,
		erro,
	};
}
