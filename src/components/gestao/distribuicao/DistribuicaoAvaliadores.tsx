import { useState } from "react";
import {
	Box,
	CircularProgress,
	FormControl,
	InputLabel,
	MenuItem,
	Select,
	Tab,
	Tabs,
	Typography,
} from "@mui/material";
import { useEditalVigentePorEtapa } from "../../../hooks/useEditalVigentePorEtapa";
import { useDistribuicaoBancas } from "../../../hooks/useDistribuicaoBancas";
import type { SiglaEtapaDistribuicao } from "../../../types";
import SecaoAnteprojeto from "./SecaoAnteprojeto";
import MontagemBancas from "./MontagemBancas";

const ABAS: { sigla: SiglaEtapaDistribuicao; label: string }[] = [
	{ sigla: "ANTEPROJETO", label: "Anteprojeto" },
	{ sigla: "ENTREVISTA", label: "Entrevista" },
	{ sigla: "ANALISE_CURRICULO", label: "Currículo" },
];

interface SecaoBancasProps {
	idEdital: number | "";
	siglaEtapa: Extract<SiglaEtapaDistribuicao, "ENTREVISTA" | "ANALISE_CURRICULO">;
	mostrarPeriodo: boolean;
}

function SecaoBancas({ idEdital, siglaEtapa, mostrarPeriodo }: SecaoBancasProps) {
	const { candidatos, docentes, loading, erro, salvando, salvarAtribuicoes } =
		useDistribuicaoBancas(idEdital, siglaEtapa);

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<MontagemBancas
			key={`${idEdital}-${siglaEtapa}`}
			mostrarPeriodo={mostrarPeriodo}
			docentesDisponiveis={docentes}
			candidatos={candidatos}
			salvando={salvando}
			erro={erro}
			onSalvarAtribuicoes={salvarAtribuicoes}
		/>
	);
}

export default function DistribuicaoAvaliadores() {
	const { editais, editalSelecionado, setEditalSelecionado, loadingEditais } =
		useEditalVigentePorEtapa("ANTEPROJETO");
	const [abaAtiva, setAbaAtiva] = useState<SiglaEtapaDistribuicao>("ANTEPROJETO");

	return (
		<Box>
			<Typography variant="h5" sx={{ mb: 3 }}>
				Distribuição de Avaliadores
			</Typography>

			<FormControl fullWidth sx={{ mb: 3, maxWidth: 480 }}>
				<InputLabel id="select-edital-distribuicao-label">
					Selecionar edital
				</InputLabel>
				<Select
					labelId="select-edital-distribuicao-label"
					value={editalSelecionado}
					label="Selecionar edital"
					onChange={(e) => setEditalSelecionado(e.target.value as number | "")}
					disabled={loadingEditais}
				>
					<MenuItem value="">
						<em>— Selecione um edital —</em>
					</MenuItem>
					{editais.map((edital) => (
						<MenuItem key={edital.id} value={edital.id}>
							{edital.numero}/{edital.ano}
							{edital.titulo ? ` — ${edital.titulo}` : ""}
						</MenuItem>
					))}
				</Select>
			</FormControl>

			<Tabs
				value={abaAtiva}
				onChange={(_, valor) => setAbaAtiva(valor)}
				sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
			>
				{ABAS.map((aba) => (
					<Tab key={aba.sigla} value={aba.sigla} label={aba.label} />
				))}
			</Tabs>

			{!editalSelecionado ? (
				<Typography variant="body2" color="text.secondary">
					Selecione um edital para continuar.
				</Typography>
			) : abaAtiva === "ANTEPROJETO" ? (
				<SecaoAnteprojeto idEdital={editalSelecionado} />
			) : abaAtiva === "ENTREVISTA" ? (
				<SecaoBancas
					idEdital={editalSelecionado}
					siglaEtapa="ENTREVISTA"
					mostrarPeriodo
				/>
			) : (
				<SecaoBancas
					idEdital={editalSelecionado}
					siglaEtapa="ANALISE_CURRICULO"
					mostrarPeriodo={false}
				/>
			)}
		</Box>
	);
}
