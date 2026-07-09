import { Box, Divider, Grid, TextField, Typography } from '@mui/material'
import { useEffect, useState } from 'react'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function sanitizeEmail(valor) {
  return valor.replace(/[\s;,<>'"\\]/g, '')
}

function formatTelefone(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 10)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
}

function formatCelular(valor) {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

function formatCep(valor) {
  const digits = valor.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 5) return digits
  return digits.replace(/^(\d{5})(\d{0,3})/, '$1-$2')
}

export default function EtapaDadosPessoais({ dados, onChange, onConfirmValidChange }) {
  const [emailTouched, setEmailTouched] = useState(false)
  const [emailConfirm, setEmailConfirm] = useState('')
  const [emailConfirmTouched, setEmailConfirmTouched] = useState(false)
  const [email2Touched, setEmail2Touched] = useState(false)
  const [email2Confirm, setEmail2Confirm] = useState('')
  const [email2ConfirmTouched, setEmail2ConfirmTouched] = useState(false)

  const handleChange = (field) => (e) => {
    onChange({ ...dados, [field]: e.target.value })
  }

  const handleMaskedChange = (field, formatter) => (e) => {
    onChange({ ...dados, [field]: formatter(e.target.value) })
  }

  const emailInvalido = emailTouched && !!dados.email && !EMAIL_REGEX.test(dados.email)
  const emailDivergente = emailConfirmTouched && !!emailConfirm && dados.email !== emailConfirm

  const email2Invalido = email2Touched && !!dados.email2 && !EMAIL_REGEX.test(dados.email2)
  const email2Divergente = email2ConfirmTouched && !!email2Confirm && dados.email2 !== email2Confirm

  const confirmValido =
    !!emailConfirm && dados.email === emailConfirm && (!dados.email2 || dados.email2 === email2Confirm)

  useEffect(() => {
    onConfirmValidChange?.(confirmValido)
  }, [confirmValido, onConfirmValidChange])

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Etapa 3: Dados Pessoais
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Preencha seus dados pessoais. Os campos marcados com * são obrigatórios.
      </Typography>

      <Grid container spacing={2}>
        <Grid size={12}>
          <TextField
            fullWidth
            label="Nome completo *"
            value={dados.nome}
            onChange={handleChange('nome')}
            required
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Data de nascimento *"
            type="date"
            value={dados.dataNascimento}
            onChange={handleChange('dataNascimento')}
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="RG"
            value={dados.rg}
            onChange={handleChange('rg')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Telefone"
            value={dados.telefone}
            onChange={handleMaskedChange('telefone', formatTelefone)}
            placeholder="(XX) XXXX-XXXX"
            inputProps={{ maxLength: 14 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Celular"
            value={dados.celular}
            onChange={handleMaskedChange('celular', formatCelular)}
            placeholder="(XX) XXXXX-XXXX"
            inputProps={{ maxLength: 15 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="E-mail *"
            value={dados.email}
            onChange={(e) => {
              onChange({ ...dados, email: sanitizeEmail(e.target.value) })
              setEmailConfirmTouched(false)
              setEmailConfirm('')
            }}
            onBlur={() => setEmailTouched(true)}
            required
            error={emailInvalido}
            helperText={emailInvalido ? 'Informe um e-mail válido.' : ''}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Confirme o e-mail *"
            value={emailConfirm}
            onChange={(e) => setEmailConfirm(sanitizeEmail(e.target.value))}
            onBlur={() => setEmailConfirmTouched(true)}
            required
            error={emailDivergente}
            helperText={emailDivergente ? 'Os e-mails não são iguais.' : ''}
            onPaste={(e) => e.preventDefault()}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="E-mail alternativo"
            value={dados.email2}
            onChange={(e) => {
              onChange({ ...dados, email2: sanitizeEmail(e.target.value) })
              setEmail2ConfirmTouched(false)
              setEmail2Confirm('')
            }}
            onBlur={() => setEmail2Touched(true)}
            error={email2Invalido}
            helperText={email2Invalido ? 'Informe um e-mail válido.' : ''}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Confirme o e-mail alternativo"
            value={email2Confirm}
            onChange={(e) => setEmail2Confirm(sanitizeEmail(e.target.value))}
            onBlur={() => setEmail2ConfirmTouched(true)}
            disabled={!dados.email2}
            error={email2Divergente}
            helperText={email2Divergente ? 'Os e-mails não são iguais.' : ''}
            onPaste={(e) => e.preventDefault()}
          />
        </Grid>

        <Grid size={12}>
          <Divider sx={{ my: 1 }}>
            <Typography variant="caption" color="text.secondary">
              Endereço
            </Typography>
          </Divider>
        </Grid>

        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            fullWidth
            label="Rua / Logradouro"
            value={dados.enderecoRua}
            onChange={handleChange('enderecoRua')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Número"
            value={dados.enderecoNum}
            onChange={handleChange('enderecoNum')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Bairro"
            value={dados.enderecoBairro}
            onChange={handleChange('enderecoBairro')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            fullWidth
            label="Cidade"
            value={dados.enderecoCidade}
            onChange={handleChange('enderecoCidade')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField
            fullWidth
            label="Estado (UF)"
            value={dados.enderecoEstado}
            onChange={handleChange('enderecoEstado')}
            inputProps={{ maxLength: 2 }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 8 }}>
          <TextField
            fullWidth
            label="CEP"
            value={dados.enderecoCep}
            onChange={handleMaskedChange('enderecoCep', formatCep)}
            placeholder="00000-000"
            inputProps={{ maxLength: 9 }}
          />
        </Grid>
      </Grid>
    </Box>
  )
}
