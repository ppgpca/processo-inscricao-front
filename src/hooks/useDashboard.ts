import { useState, useEffect, useCallback } from "react";
import { dashboardService } from "../services/dashboard.service";
import type { DadosDashboard } from "../types";

export function useDashboard(idEdital?: number) {
	const [dados, setDados] = useState<DadosDashboard | null>(null);
	const [loading, setLoading] = useState(true);
	const [erro, setErro] = useState<string | null>(null);

	const carregar = useCallback(async () => {
		setLoading(true);
		setErro(null);
		try {
			const resultado = await dashboardService.obterDados(idEdital);
			setDados(resultado);
		} catch {
			setErro("Não foi possível carregar os dados do dashboard.");
		} finally {
			setLoading(false);
		}
	}, [idEdital]);

	useEffect(() => {
		carregar();
	}, [carregar]);

	return { dados, loading, erro, recarregar: carregar };
}
