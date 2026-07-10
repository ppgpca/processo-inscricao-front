import CheckCircleIcon from '@mui/icons-material/CheckCircle'
import EditIcon from '@mui/icons-material/Edit'
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material'
import { useState } from 'react'

import {
  formatarCpf,
  limparCpf,
  validarCpfDigitos,
  isInscricaoFinalizada,
  obterLabelEtapa,
  validarConfirmacaoNumeroInscricao,
} from '../../controllers/cpf-controller.js'

export default function EtapaCpf({ onCpfSubmit, onContinuarExistente, onEditarInscricao, onIniciarNova }) {
  const [cpf, setCpf] = useState('')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [confirmNovaOpen, setConfirmNovaOpen] = useState(false)
  const [confirmNumeroInscricao, setConfirmNumeroInscricao] = useState('')
  const [inscricaoEncontrada, setInscricaoEncontrada] = useState(null)
  const [candidatoEncontrado, setCandidatoEncontrado] = useState(null)
  const [inscricaoHistoricoEncontrada, setInscricaoHistoricoEncontrada] = useState(null)

  const cpfLimpo = limparCpf(cpf)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validacao = validarCpfDigitos(cpfLimpo)
    if (!validacao.valido) {
      setErro(validacao.erro)
      return
    }
    setErro('')
    setLoading(true)
    try {
      const { inscricaoExistente, candidatoExistente, inscricaoHistorico } = await onCpfSubmit(cpfLimpo)
      setCandidatoEncontrado(candidatoExistente)
      setInscricaoHistoricoEncontrada(inscricaoHistorico)
      if (inscricaoExistente) {
        setInscricaoEncontrada(inscricaoExistente)
        setModalOpen(true)
      } else {
        onIniciarNova(null, candidatoExistente, inscricaoHistorico)
      }
    } catch {
      setErro('Erro ao verificar CPF. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerInscricao = () => {
    setModalOpen(false)
    if (inscricaoEncontrada) {
      onContinuarExistente(inscricaoEncontrada, candidatoEncontrado)
    }
  }

  const handleEditarInscricao = () => {
    setModalOpen(false)
    if (inscricaoEncontrada) {
      onEditarInscricao(inscricaoEncontrada, candidatoEncontrado)
    }
  }

  const handleContinuar = () => {
    setModalOpen(false)
    if (inscricaoEncontrada) {
      onContinuarExistente(inscricaoEncontrada, candidatoEncontrado)
    }
  }

  const handleSolicitarNovaInscricao = () => {
    setModalOpen(false)
    setConfirmNumeroInscricao('')
    setConfirmNovaOpen(true)
  }

  const handleCancelarNovaInscricao = () => {
    setConfirmNovaOpen(false)
    setConfirmNumeroInscricao('')
  }

  const handleConfirmarNovaInscricao = () => {
    setConfirmNovaOpen(false)
    setConfirmNumeroInscricao('')
    onIniciarNova(inscricaoEncontrada, candidatoEncontrado, inscricaoHistoricoEncontrada)
  }

  const numeroInscricaoConfirmadoCorreto = validarConfirmacaoNumeroInscricao(
    confirmNumeroInscricao,
    inscricaoEncontrada?.id,
  )

  const finalizada = inscricaoEncontrada ? isInscricaoFinalizada(inscricaoEncontrada) : false

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Etapa 1: Identificação
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Informe seu CPF para iniciar ou continuar a inscrição.
      </Typography>

      <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 400 }}>
        <TextField
          fullWidth
          label="CPF"
          value={cpf}
          onChange={(e) => setCpf(formatarCpf(e.target.value))}
          placeholder="000.000.000-00"
          slotProps={{ htmlInput: { maxLength: 14 } }}
          error={!!erro}
          helperText={erro}
          sx={{ mb: 3 }}
          autoFocus
        />

        <Button
          type="submit"
          variant="contained"
          color="primary"
          disabled={loading || cpfLimpo.length !== 11}
          startIcon={loading ? <CircularProgress size={16} /> : undefined}
        >
          {loading ? 'Verificando...' : 'Continuar'}
        </Button>
      </Box>

      {/* Modal: inscrição finalizada */}
      <Dialog open={modalOpen && finalizada} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CheckCircleIcon color="success" />
          Inscrição já enviada
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Você já possui uma inscrição <strong>enviada</strong> para o edital vigente.
            {inscricaoEncontrada?.id && (
              <> Número de inscrição: <strong>{inscricaoEncontrada.id}</strong>.</>
            )}
          </DialogContentText>
          <Alert severity="success" sx={{ mt: 2 }}>
            Sua inscrição foi registrada com sucesso. Clique em{' '}
            <strong>&quot;Ver minha inscrição&quot;</strong> para conferir os dados.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          <Button onClick={handleVerInscricao} variant="contained" color="primary" fullWidth>
            Ver minha inscrição
          </Button>
          <Button onClick={handleEditarInscricao} variant="outlined" color="primary" fullWidth>
            Editar documentos da inscrição
          </Button>
          <Button
            onClick={handleSolicitarNovaInscricao}
            variant="outlined"
            fullWidth
            sx={{ color: 'warning.dark', borderColor: 'warning.main', '&:hover': { borderColor: 'warning.dark', backgroundColor: 'warning.50' } }}
          >
            Iniciar nova inscrição (a inscrição atual será desativada)
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal: inscrição em andamento */}
      <Dialog open={modalOpen && !finalizada} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EditIcon color="primary" />
          Inscrição em andamento
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Encontramos uma inscrição em andamento para este CPF no edital vigente. Deseja
            continuar de onde parou ou iniciar uma nova?
          </DialogContentText>
          {inscricaoEncontrada && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Você retornará para:{' '}
              <strong>
                {obterLabelEtapa((inscricaoEncontrada.etapa ?? 0) + 1)}
              </strong>
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button
            onClick={handleSolicitarNovaInscricao}
            variant="outlined"
            sx={{ color: 'warning.dark', borderColor: 'warning.main', '&:hover': { borderColor: 'warning.dark', backgroundColor: 'warning.50' } }}
          >
            Iniciar nova
          </Button>
          <Button onClick={handleContinuar} variant="contained" color="primary">
            Continuar inscrição
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmação para nova inscrição */}
      <Dialog open={confirmNovaOpen} onClose={handleCancelarNovaInscricao} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmar nova inscrição</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            A inscrição <strong>nº {inscricaoEncontrada?.id}</strong> será{' '}
            <strong>desativada</strong> e você precisará preencher os dados novamente.
            Esta ação não pode ser desfeita.
          </Alert>
          <DialogContentText sx={{ mb: 2 }}>
            Para confirmar, digite o <strong>número da sua inscrição atual</strong> no campo abaixo:
          </DialogContentText>
          <TextField
            fullWidth
            label="Número da inscrição atual"
            placeholder={String(inscricaoEncontrada?.id ?? '')}
            value={confirmNumeroInscricao}
            onChange={(e) => setConfirmNumeroInscricao(e.target.value)}
            error={confirmNumeroInscricao.trim() !== '' && !numeroInscricaoConfirmadoCorreto}
            helperText={
              confirmNumeroInscricao.trim() !== '' && !numeroInscricaoConfirmadoCorreto
                ? 'Número de inscrição incorreto'
                : ' '
            }
            autoFocus
            inputProps={{ inputMode: 'numeric' }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelarNovaInscricao} color="inherit">
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmarNovaInscricao}
            variant="contained"
            color="warning"
            disabled={!numeroInscricaoConfirmadoCorreto}
          >
            Confirmar nova inscrição
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
