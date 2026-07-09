import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from '@mui/material'
import { useEffect, useState } from 'react'

import { linhaPesquisaService } from '../../services/linha-pesquisa.service.js'

export default function EtapaProjetoPesquisa({ dados, onChange }) {
  const [linhas, setLinhas] = useState([])
  const [loadingLinhas, setLoadingLinhas] = useState(true)

  useEffect(() => {
    linhaPesquisaService
      .findAll()
      .then(setLinhas)
      .catch(() => setLinhas([]))
      .finally(() => setLoadingLinhas(false))
  }, [])

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    onChange({ ...dados, [field]: value })
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Etapa 2: Linha de Pesquisa e Projeto
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Informe a linha de pesquisa, o título do seu projeto e as cotas para as quais deseja
        concorrer.
      </Typography>

      <Grid container spacing={3}>
        <Grid size={12}>
          <FormControl fullWidth required>
            <InputLabel id="linha-pesquisa-label">Linha de Pesquisa *</InputLabel>
            {loadingLinhas ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Carregando linhas de pesquisa...</Typography>
              </Box>
            ) : (
              <Select
                labelId="linha-pesquisa-label"
                label="Linha de Pesquisa *"
                value={dados.idLinhaPesquisa}
                onChange={(e) => onChange({ ...dados, idLinhaPesquisa: Number(e.target.value) })}
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
            onChange={handleChange('projetoPesquisa')}
            required
            multiline
            rows={2}
            placeholder="Informe o título do seu projeto de pesquisa..."
          />
        </Grid>

        <Grid size={12}>
          <Alert severity="info" sx={{ mb: 2 }}>
            Marque abaixo caso deseje concorrer a vagas reservadas conforme o Edital. A comprovação deverá ser
            apresentada mediante documentação.
          </Alert>
          <FormControl component="fieldset">
            <FormLabel component="legend">Cotas / Reserva de Vagas</FormLabel>
            <FormGroup>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dados.deficiente}
                    onChange={handleChange('deficiente')}
                  />
                }
                label="Pessoa com deficiência (PcD)"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dados.indigena}
                    onChange={handleChange('indigena')}
                  />
                }
                label="Pessoa indígena"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={dados.pretoPardo}
                    onChange={handleChange('pretoPardo')}
                  />
                }
                label="Pessoa preta ou parda"
              />
            </FormGroup>
          </FormControl>
        </Grid>
      </Grid>
    </Box>
  )
}
