import {
	Alert,
	Box,
	Checkbox,
	Chip,
	CircularProgress,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	FormLabel,
	Grid,
	InputLabel,
	MenuItem,
	OutlinedInput,
	Select,
	TextField,
	Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import type { LinhaPesquisa, PalavraChave, ProjetoPesquisa } from "../../types";
import { linhaPesquisaService } from "../../services/linha-pesquisa.service";
import { palavraChaveService } from "../../services/palavra-chave.service";

interface EtapaProjetoPesquisaProps {
	dados: ProjetoPesquisa;
	onChange: (dados: ProjetoPesquisa) => void;
}

export default function EtapaProjetoPesquisa({
	dados,
	onChange,
}: EtapaProjetoPesquisaProps) {
	const [linhas, setLinhas] = useState<LinhaPesquisa[]>([]);
	const [loadingLinhas, setLoadingLinhas] = useState(true);
	const [palavrasChave, setPalavrasChave] = useState<PalavraChave[]>([]);
	const [loadingPalavras, setLoadingPalavras] = useState(true);

	useEffect(() => {
		linhaPesquisaService
			.findAll()
			.then(setLinhas)
			.catch(() => setLinhas([]))
			.finally(() => setLoadingLinhas(false));

		palavraChaveService
			.findAll()
			.then(setPalavrasChave)
			.catch(() => setPalavrasChave([]))
			.finally(() => setLoadingPalavras(false));
	}, []);

	const handleChange =
		(field: keyof ProjetoPesquisa) =>
		(e: ChangeEvent<HTMLInputElement>) => {
			const value =
				e.target.type === "checkbox"
					? e.target.checked
					: e.target.value;
			onChange({ ...dados, [field]: value });
		};

	const handlePalavrasChaveChange = (ids: number[]) => {
		if (ids.length <= 5) {
			onChange({ ...dados, idsPalavrasChave: ids });
		}
	};

	const palavrasSelecionadas = palavrasChave.filter((p) =>
		dados.idsPalavrasChave.includes(p.id),
	);

	const quantidadeSelecionada = dados.idsPalavrasChave.length;
	const excedeuLimite = quantidadeSelecionada > 5;
	const semSelecao = quantidadeSelecionada === 0;

	return (
		<Box>
			<Typography variant="h6" gutterBottom>
				Etapa 2: Linha de Pesquisa e Projeto
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				Informe a linha de pesquisa, o título do seu projeto e as cotas
				para as quais deseja concorrer.
			</Typography>

			<Grid container spacing={3}>
				<Grid size={12}>
					<FormControl fullWidth required>
						<InputLabel id="linha-pesquisa-label">
							Linha de Pesquisa *
						</InputLabel>
						{loadingLinhas ? (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									p: 1,
								}}
							>
								<CircularProgress size={16} />
								<Typography variant="body2">
									Carregando linhas de pesquisa...
								</Typography>
							</Box>
						) : (
							<Select
								labelId="linha-pesquisa-label"
								label="Linha de Pesquisa *"
								value={dados.idLinhaPesquisa}
								onChange={(e) =>
									onChange({
										...dados,
										idLinhaPesquisa: Number(e.target.value),
									})
								}
							>
								{linhas.map((lp) => (
									<MenuItem key={lp.id} value={lp.id}>
										{lp.nome}
									</MenuItem>
								))}
							</Select>
						)}
					</FormControl>
				</Grid>

				<Grid size={12}>
					<TextField
						fullWidth
						label="Título do Projeto *"
						value={dados.projetoPesquisa}
						onChange={handleChange("projetoPesquisa")}
						required
						multiline
						rows={2}
						placeholder="Informe o título do seu projeto de pesquisa..."
					/>
				</Grid>

				<Grid size={12}>
					<FormControl fullWidth required error={excedeuLimite}>
						<InputLabel id="palavras-chave-label">
							Palavras-chave *
						</InputLabel>
						{loadingPalavras ? (
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									p: 1,
								}}
							>
								<CircularProgress size={16} />
								<Typography variant="body2">
									Carregando palavras-chave...
								</Typography>
							</Box>
						) : (
							<Select
								labelId="palavras-chave-label"
								label="Palavras-chave *"
								multiple
								value={dados.idsPalavrasChave}
								onChange={(e) => {
									const value = e.target.value as number[];
									handlePalavrasChaveChange(value);
								}}
								input={
									<OutlinedInput label="Palavras-chave *" />
								}
								MenuProps={{
									anchorOrigin: {
										vertical: "bottom",
										horizontal: "left",
									},
									transformOrigin: {
										vertical: "top",
										horizontal: "left",
									},
									slotProps: {
										paper: {
											style: { maxHeight: 280 },
										},
									},
								}}
								renderValue={() => (
									<Box
										sx={{
											display: "flex",
											flexWrap: "wrap",
											gap: 0.5,
										}}
									>
										{palavrasSelecionadas.map((p) => (
											<Chip
												key={p.id}
												label={p.palavra}
												size="small"
											/>
										))}
									</Box>
								)}
							>
								{palavrasChave.map((p) => {
									const selecionada =
										dados.idsPalavrasChave.includes(p.id);
									const desabilitada =
										!selecionada &&
										quantidadeSelecionada >= 5;
									return (
										<MenuItem
											key={p.id}
											value={p.id}
											disabled={desabilitada}
											sx={{ gap: 1 }}
										>
											<Checkbox
												checked={selecionada}
												size="small"
												disableRipple
												tabIndex={-1}
											/>
											{p.palavra}
										</MenuItem>
									);
								})}
							</Select>
						)}
						<FormHelperText>
							{excedeuLimite
								? "Máximo de 5 palavras-chave permitidas"
								: `Selecione de 1 a 5 palavras-chave (${quantidadeSelecionada}/5 selecionada${quantidadeSelecionada !== 1 ? "s" : ""})`}
						</FormHelperText>
					</FormControl>
					{semSelecao && !loadingPalavras && (
						<Alert severity="info" sx={{ mt: 1 }}>
							Selecione ao menos uma palavra-chave relacionada ao
							seu projeto.
						</Alert>
					)}
				</Grid>

				<Grid size={12}>
					<Alert severity="info" sx={{ mb: 2 }}>
						Marque abaixo caso deseje concorrer a vagas reservadas
						conforme o Edital. A comprovação deverá ser apresentada
						mediante documentação.
					</Alert>
					<FormControl component="fieldset">
						<FormLabel component="legend">
							Cotas / Reserva de Vagas
						</FormLabel>
						<FormGroup>
							<FormControlLabel
								control={
									<Checkbox
										checked={dados.deficiente}
										onChange={handleChange("deficiente")}
									/>
								}
								label="Pessoa com deficiência (PcD)"
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={dados.indigena}
										onChange={handleChange("indigena")}
									/>
								}
								label="Pessoa indígena"
							/>
							<FormControlLabel
								control={
									<Checkbox
										checked={dados.pretoPardo}
										onChange={handleChange("pretoPardo")}
									/>
								}
								label="Pessoa preta ou parda"
							/>
						</FormGroup>
					</FormControl>
				</Grid>
			</Grid>
		</Box>
	);
}
