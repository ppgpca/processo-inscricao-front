import { Box, Divider, Grid, TextField, Typography } from '@mui/material'

function aplicarMascaraTelefone(valor) {
  const digits = valor.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{0,2})/, '($1')
      .replace(/^(\(\d{2})(\d)/, '$1) $2')
      .replace(/(\d{4})(\d{1,4})$/, '$1-$2')
  }
  return digits
    .replace(/^(\d{0,2})/, '($1')
    .replace(/^(\(\d{2})(\d)/, '$1) $2')
    .replace(/(\d{5})(\d{1,4})$/, '$1-$2')
}

const ANO_MIN = 1950
const ANO_MAX = new Date().getFullYear() + 1

function validarAno(valor) {
  if (!valor) return null
  const ano = Number(valor)
  if (ano < ANO_MIN) return `Ano não pode ser anterior a ${ANO_MIN}`
  if (ano > ANO_MAX) return `Ano não pode ser posterior a ${ANO_MAX}`
  return null
}

export default function EtapaFormacao({ dados, onChange }) {
  const g1 = dados.graduacao1 ?? { curso: '', instituicao: '', anoConclusao: '' }
  const g2 = dados.graduacao2 ?? { curso: '', instituicao: '', anoConclusao: '' }
  const op = dados.ocupacaoProfissional ?? { instituicao: '', cargo: '', telefone: '' }

  const erroAnoG1 = validarAno(g1.anoConclusao)
  const erroAnoG2 = validarAno(g2.anoConclusao)

  const updateG1 = (field) => (e) =>
    onChange({ ...dados, graduacao1: { ...g1, [field]: e.target.value } })

  const updateG2 = (field) => (e) =>
    onChange({ ...dados, graduacao2: { ...g2, [field]: e.target.value } })

  const updateOp = (field) => (e) =>
    onChange({ ...dados, ocupacaoProfissional: { ...op, [field]: e.target.value } })

  const updateOpTelefone = (e) => {
    const masked = aplicarMascaraTelefone(e.target.value)
    onChange({ ...dados, ocupacaoProfissional: { ...op, telefone: masked } })
  }

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
            inputProps={{ min: ANO_MIN, max: ANO_MAX }}
            error={!!erroAnoG1}
            helperText={erroAnoG1}
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
            inputProps={{ min: ANO_MIN, max: ANO_MAX }}
            error={!!erroAnoG2}
            helperText={erroAnoG2}
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
            onChange={updateOpTelefone}
            placeholder="(XX) XXXXX-XXXX"
            inputProps={{ maxLength: 15 }}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
