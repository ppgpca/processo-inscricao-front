import { useState } from "react";
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
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
import type { NomeEtapaDistribuicao } from "../../../types";
import SecaoAnteprojeto from "./SecaoAnteprojeto";
import MontagemBancas from "./MontagemBancas";

const ABAS: { nome: NomeEtapaDistribuicao; label: string }[] = [
	{ nome: "ANTEPROJETO", label: "Anteprojeto" },
	{ nome: "ENTREVISTA", label: "Entrevista" },
	{ nome: "ANALISE_CURRICULO", label: "Currículo" },
];

interface SecaoBancasProps {
	idEdital: number | "";
	nomeEtapa: Extract<NomeEtapaDistribuicao, "ENTREVISTA" | "ANALISE_CURRICULO">;
	mostrarPeriodo: boolean;
	maximoDocentes?: number | null;
	quantidadeExata?: boolean;
	onTemPendenciasChange?: (temPendencias: boolean) => void;
}

function SecaoBancas({
	idEdital,
	nomeEtapa,
	mostrarPeriodo,
	maximoDocentes = null,
	quantidadeExata = false,
	onTemPendenciasChange,
}: SecaoBancasProps) {
	const { candidatos, docentes, loading, erro, salvando, salvarAtribuicoes } =
		useDistribuicaoBancas(idEdital, nomeEtapa);

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", mt: 6 }}>
				<CircularProgress />
			</Box>
		);
	}

	return (
		<MontagemBancas
			key={`${idEdital}-${nomeEtapa}`}
			mostrarPeriodo={mostrarPeriodo}
			maximoDocentes={maximoDocentes}
			quantidadeExata={quantidadeExata}
			docentesDisponiveis={docentes}
			candidatos={candidatos}
			salvando={salvando}
			erro={erro}
			onSalvarAtribuicoes={salvarAtribuicoes}
			onTemPendenciasChange={onTemPendenciasChange}
		/>
	);
}

export default function DistribuicaoAvaliadores() {
	const { editais, editalSelecionado, setEditalSelecionado, loadingEditais } =
		useEditalVigentePorEtapa("ANTEPROJETO");
	const [abaAtiva, setAbaAtiva] = useState<NomeEtapaDistribuicao>("ANTEPROJETO");
	const [temPendencias, setTemPendencias] = useState(false);
	const [abaPendente, setAbaPendente] = useState<NomeEtapaDistribuicao | null>(
		null,
	);

	const handleTabChange = (
		_: React.SyntheticEvent,
		valor: NomeEtapaDistribuicao,
	) => {
		if (valor === abaAtiva) return;
		if (temPendencias) {
			setAbaPendente(valor);
			return;
		}
		setAbaAtiva(valor);
	};

	const confirmarTrocaAba = () => {
		if (!abaPendente) return;
		setTemPendencias(false);
		setAbaAtiva(abaPendente);
		setAbaPendente(null);
	};

	const cancelarTrocaAba = () => setAbaPendente(null);

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
				onChange={handleTabChange}
				sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
			>
				{ABAS.map((aba) => (
					<Tab key={aba.nome} value={aba.nome} label={aba.label} />
				))}
			</Tabs>

			{!editalSelecionado ? (
				<Typography variant="body2" color="text.secondary">
					Selecione um edital para continuar.
				</Typography>
			) : abaAtiva === "ANTEPROJETO" ? (
				<SecaoAnteprojeto
					idEdital={editalSelecionado}
					onTemPendenciasChange={setTemPendencias}
				/>
			) : abaAtiva === "ENTREVISTA" ? (
				<SecaoBancas
					idEdital={editalSelecionado}
					nomeEtapa="ENTREVISTA"
					mostrarPeriodo
					maximoDocentes={3}
					quantidadeExata
					onTemPendenciasChange={setTemPendencias}
				/>
			) : (
				<SecaoBancas
					idEdital={editalSelecionado}
					nomeEtapa="ANALISE_CURRICULO"
					mostrarPeriodo={false}
					onTemPendenciasChange={setTemPendencias}
				/>
			)}

			<Dialog open={Boolean(abaPendente)} onClose={cancelarTrocaAba}>
				<DialogTitle>Alterações não sincronizadas</DialogTitle>
				<DialogContent>
					<Typography>
						Há atribuições pendentes de sincronização ou bancas criadas sem
						candidatos atribuídos. Ao trocar de aba, essas alterações serão
						perdidas. Deseja continuar?
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={cancelarTrocaAba} color="inherit">
						Cancelar
					</Button>
					<Button onClick={confirmarTrocaAba} variant="contained" color="warning">
						Descartar e trocar
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
