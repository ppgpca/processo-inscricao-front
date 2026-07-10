import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined'
import CloudUploadIcon from '@mui/icons-material/CloudUpload'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import DownloadIcon from '@mui/icons-material/Download'
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Snackbar,
  Tooltip,
  Typography,
} from '@mui/material'
import { useCallback, useEffect, useRef, useState } from 'react'

import { documentoService } from '../../services/documento.service.js'
import {
  validarArquivo,
  obterDocumentoAtual,
  todosObrigatoriosEnviados,
  ordenarTiposDocumentoAtivos,
  extrairNomeArquivoDownload,
  obterMensagemErroUpload,
  formatarTamanhoArquivo,
} from '../../controllers/documentos-controller.js'

export default function EtapaDocumentos({ idInscricao, tiposDocumento, onDocumentosAtualizados }) {
  const [documentos, setDocumentos] = useState([])
  const [uploading, setUploading] = useState(null)
  const [loadingInit, setLoadingInit] = useState(true)
  const [erro, setErro] = useState(null)
  const inputRefs = useRef({})

  const carregarDocumentos = useCallback(async () => {
    try {
      const docs = await documentoService.findByInscricao(idInscricao)
      setDocumentos(docs)
      onDocumentosAtualizados?.(docs)
    } catch {
      setDocumentos([])
    }
  }, [idInscricao, onDocumentosAtualizados])

  useEffect(() => {
    carregarDocumentos().finally(() => setLoadingInit(false))
  }, [carregarDocumentos])

  const documentoAtual = (idTipo) => obterDocumentoAtual(documentos, idTipo)

  const baixarDocumento = useCallback(async (idTipo, nomeOriginal) => {
    try {
      const url = documentoService.getDownloadUrl(idInscricao, idTipo)
      const response = await fetch(url)
      if (!response.ok) throw new Error('Falha ao baixar arquivo')
      const disposition = response.headers.get('Content-Disposition') ?? ''
      const nomeArquivo = extrairNomeArquivoDownload(disposition, nomeOriginal)
      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = nomeArquivo
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(objectUrl)
    } catch {
      setErro('Não foi possível baixar o arquivo. Tente novamente.')
    }
  }, [idInscricao])

  const handleUpload = async (idTipo, file) => {
    const erroArquivo = validarArquivo(file)
    if (erroArquivo) {
      setErro(erroArquivo)
      return
    }

    setUploading(idTipo)
    try {
      await documentoService.upload(idInscricao, idTipo, file)
      await carregarDocumentos()
    } catch (e) {
      setErro(obterMensagemErroUpload(e))
    } finally {
      setUploading(null)
      if (inputRefs.current[idTipo]) {
        inputRefs.current[idTipo].value = ''
      }
    }
  }

  const handleRemover = async (idTipo) => {
    try {
      await documentoService.remover(idInscricao, idTipo)
      await carregarDocumentos()
    } catch {
      setErro('Erro ao remover o documento. Tente novamente.')
    }
  }

  const allObrigatoriosEnviados = todosObrigatoriosEnviados(tiposDocumento, documentos)

  if (loadingInit) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Etapa 5: Documentos
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Faça o upload dos documentos exigidos. Documentos obrigatórios estão marcados com *.
        Formatos aceitos: PDF, JPG, PNG (máx. 10 MB).
      </Typography>

      {allObrigatoriosEnviados && (
        <Alert severity="success" sx={{ mb: 2 }} icon={<CheckCircleOutlinedIcon />}>
          Todos os documentos obrigatórios foram enviados. Você pode finalizar a inscrição.
        </Alert>
      )}

      <List disablePadding>
        {ordenarTiposDocumentoAtivos(tiposDocumento)
          .map((tipo, idx) => {
            const doc = documentoAtual(tipo.id)
            const isUploading = uploading === tipo.id

            return (
              <Paper
                key={tipo.id}
                variant="outlined"
                sx={{ mb: 1.5 }}
              >
                <ListItem
                  sx={{ py: 1.5 }}
                  secondaryAction={
                    <ListItemSecondaryAction sx={{ display: 'flex', gap: 0.5 }}>
                      {doc && (
                        <>
                          <Tooltip title="Baixar documento">
                            <IconButton
                              size="small"
                              color="primary"
                              disabled={isUploading}
                              onClick={() => baixarDocumento(tipo.id, doc.nomeArquivoOriginal)}
                            >
                              <DownloadIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Remover documento">
                            <IconButton
                              edge="end"
                              onClick={() => handleRemover(tipo.id)}
                              disabled={isUploading}
                              color="error"
                              size="small"
                            >
                              <DeleteOutlinedIcon />
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                    </ListItemSecondaryAction>
                  }
                >
                  <ListItemText
                    slotProps={{ primary: { component: 'div' }, secondary: { component: 'div' } }}
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography variant="body1">
                          {idx + 1}. {tipo.nome}
                          {tipo.obrigatorio ? ' *' : ''}
                        </Typography>
                        {doc ? (
                          <Chip
                            label="Enviado"
                            color="success"
                            size="small"
                            icon={<CheckCircleOutlinedIcon />}
                          />
                        ) : (
                          <Chip
                            label={tipo.obrigatorio ? 'Obrigatório' : 'Opcional'}
                            color={tipo.obrigatorio ? 'warning' : 'default'}
                            size="small"
                          />
                        )}
                      </Box>
                    }
                    secondary={
                      <Box sx={{ mt: 0.5 }}>
                        {tipo.descricao && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {tipo.descricao}
                          </Typography>
                        )}
                        {doc && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            Arquivo: {doc.nomeArquivoOriginal} —{' '}
                            {formatarTamanhoArquivo(doc.tamanhoBytes)}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>

                <Divider />

                <Box sx={{ px: 2, py: 1 }}>
                  <input
                    type="file"
                    id={`upload-${tipo.id}`}
                    accept=".pdf,.jpg,.jpeg,.png,.webp"
                    style={{ display: 'none' }}
                    ref={(el) => { inputRefs.current[tipo.id] = el }}
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleUpload(tipo.id, file)
                    }}
                  />
                  <Box
                    component="label"
                    htmlFor={`upload-${tipo.id}`}
                    sx={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 0.5,
                      cursor: 'pointer',
                      color: 'primary.main',
                      fontSize: '0.875rem',
                      fontWeight: 500,
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {isUploading ? (
                      <>
                        <CircularProgress size={14} />
                        Enviando...
                      </>
                    ) : (
                      <>
                        <CloudUploadIcon fontSize="small" />
                        {doc ? 'Substituir arquivo' : 'Selecionar arquivo'}
                      </>
                    )}
                  </Box>
                </Box>
              </Paper>
            )
          })}
      </List>

      <Snackbar
        open={!!erro}
        autoHideDuration={6000}
        onClose={() => setErro(null)}
      >
        <Alert severity="error" onClose={() => setErro(null)}>
          {erro}
        </Alert>
      </Snackbar>
    </Box>
  )
}
