import { Box, Divider, Grid, TextField, Typography } from '@mui/material'

export default function EtapaFormacao({ dados, onChange }) {
  const g1 = dados.graduacao1 ?? { curso: '', instituicao: '', anoConclusao: '' }
  const g2 = dados.graduacao2 ?? { curso: '', instituicao: '', anoConclusao: '' }
  const op = dados.ocupacaoProfissional ?? { instituicao: '', cargo: '', telefone: '' }

  const updateG1 = (field) => (e) =>
    onChange({ ...dados, graduacao1: { ...g1, [field]: e.target.value } })

  const updateG2 = (field) => (e) =>
    onChange({ ...dados, graduacao2: { ...g2, [field]: e.target.value } })

  const updateOp = (field) => (e) =>
    onChange({ ...dados, ocupacaoProfissional: { ...op, [field]: e.target.value } })

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Etapa 4: Formação Acadêmica e Ocupação Profissional
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Informe seus cursos de graduação e ocupação profissional atual.
      </Typography>

      <Divider sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Graduação 1
        </Typography>
      </Divider>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth
            label="Curso de Graduação *"
            value={g1.curso}
            onChange={updateG1('curso')}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth
            label="Instituição *"
            value={g1.instituicao}
            onChange={updateG1('instituicao')}
            required
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <TextField
            fullWidth
            label="Ano de Conclusão *"
            type="number"
            value={g1.anoConclusao}
            onChange={updateG1('anoConclusao')}
            required
            inputProps={{ min: 1950, max: new Date().getFullYear() }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Graduação 2 (opcional)
        </Typography>
      </Divider>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth
            label="Curso de Graduação"
            value={g2.curso}
            onChange={updateG2('curso')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth
            label="Instituição"
            value={g2.instituicao}
            onChange={updateG2('instituicao')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 2 }}>
          <TextField
            fullWidth
            label="Ano de Conclusão"
            type="number"
            value={g2.anoConclusao}
            onChange={updateG2('anoConclusao')}
            inputProps={{ min: 1950, max: new Date().getFullYear() }}
          />
        </Grid>
      </Grid>

      <Divider sx={{ mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Ocupação Profissional (opcional)
        </Typography>
      </Divider>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 5 }}>
          <TextField
            fullWidth
            label="Instituição / Empresa"
            value={op.instituicao}
            onChange={updateOp('instituicao')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Cargo / Função"
            value={op.cargo}
            onChange={updateOp('cargo')}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 3 }}>
          <TextField
            fullWidth
            label="Telefone"
            value={op.telefone}
            onChange={updateOp('telefone')}
            placeholder="(XX) XXXX-XXXX"
          />
        </Grid>
      </Grid>
    </Box>
  )
}
