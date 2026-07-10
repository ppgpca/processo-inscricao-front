import { useCallback, useState } from 'react'

import { candidatoService } from '../services/candidato.service.js'
import { inscricaoService } from '../services/inscricao.service.js'
import { carregarDadosPessoaisExistentes, getInitialDadosPessoais } from '../controllers/dados-pessoais-controller.js'
import { carregarDadosComplementares, getInitialDadosComplementares } from '../controllers/formacao-controller.js'
import { carregarProjetoPesquisaExistente, getInitialProjetoPesquisa } from '../controllers/projeto-pesquisa-controller.js'
import {
	obterStepParaContinuar,
	prepararPayloadEtapa2,
	prepararPayloadEtapa3,
	prepararPayloadFinalizacao,
	obterFonteDadosComplementares,
} from '../controllers/inscricao-controller.js'
import { prepararPayloadCandidato } from '../controllers/dados-pessoais-controller.js'

export function useInscricao(edital) {
  const [activeStep, setActiveStep] = useState(0)
  const [cpf, setCpf] = useState('')
  const [inscricao, setInscricao] = useState(null)
  const [candidato, setCandidato] = useState(null)
  const [inscricaoHistorico, setInscricaoHistorico] = useState(null)
  const [dadosPessoais, setDadosPessoais] = useState(getInitialDadosPessoais)
  const [dadosComplementares, setDadosComplementares] = useState(getInitialDadosComplementares)
  const [projetoPesquisa, setProjetoPesquisa] = useState(getInitialProjetoPesquisa)
  const [saving, setSaving] = useState(false)
  const [inscricaoEnviada, setInscricaoEnviada] = useState(false)
  const [message, setMessage] = useState(null)

  const showMessage = (text, severity = 'success') => {
    setMessage({ text, severity })
  }

  const carregarDadosExistentes = useCallback((insc, cand) => {
    if (cand) {
      setDadosPessoais(carregarDadosPessoaisExistentes(cand))
    }

    if (insc.dadosComplementares) {
      setDadosComplementares(carregarDadosComplementares(insc.dadosComplementares))
    }

    setProjetoPesquisa(carregarProjetoPesquisaExistente(insc))
  }, [])

  const handleCpfSubmit = useCallback(
    async (cpfInformado) => {
      if (!edital) throw new Error('Nenhum edital vigente encontrado.')
      setCpf(cpfInformado)

      const [inscricaoExistente, candidatoExistente] = await Promise.all([
        inscricaoService.findByCpfEdital(cpfInformado, edital.id),
        candidatoService.findByCpf(cpfInformado),
      ])

      let inscricaoHistoricoEncontrada = null
      if (candidatoExistente) {
        setCandidato(candidatoExistente)
        inscricaoHistoricoEncontrada = await inscricaoService.findMaisRecentePorCpf(cpfInformado).catch(() => null)
        setInscricaoHistorico(inscricaoHistoricoEncontrada)
      }

      if (inscricaoExistente) {
        setInscricao(inscricaoExistente)
        carregarDadosExistentes(inscricaoExistente, candidatoExistente)
      }

      return { inscricaoExistente, candidatoExistente, inscricaoHistorico: inscricaoHistoricoEncontrada }
    },
    [edital, carregarDadosExistentes],
  )

  const continuarInscricaoExistente = useCallback(
    (insc, cand) => {
      setInscricao(insc)
      if (cand) setCandidato(cand)
      carregarDadosExistentes(insc, cand)

      if (insc.status === 'enviada' || (insc.etapa ?? 0) >= 5) {
        setInscricaoEnviada(true)
        return
      }

      setActiveStep(obterStepParaContinuar(insc.etapa))
    },
    [carregarDadosExistentes],
  )

  const editarInscricaoExistente = useCallback(
    (insc, cand) => {
      setInscricao(insc)
      if (cand) setCandidato(cand)
      carregarDadosExistentes(insc, cand)
      setActiveStep(4)
    },
    [carregarDadosExistentes],
  )

  const iniciarNovaInscricao = useCallback(
    async (inscricaoAnterior, candExistente, inscricaoHistoricoParam) => {
      if (!edital) throw new Error('Nenhum edital vigente encontrado.')

      if (inscricaoAnterior) {
        await inscricaoService.desativar(inscricaoAnterior.id)
      }

      if (candExistente) {
        setDadosPessoais(carregarDadosPessoaisExistentes(candExistente))
        setCandidato(candExistente)
      }

      const fonteDc = obterFonteDadosComplementares(inscricaoAnterior, inscricaoHistoricoParam ?? inscricaoHistorico)
      setDadosComplementares(carregarDadosComplementares(fonteDc))

      setProjetoPesquisa(getInitialProjetoPesquisa())
      setInscricao(null)
      setActiveStep(1)
    },
    [edital, inscricaoHistorico],
  )

  const salvarEtapa2 = useCallback(async () => {
    if (!edital) return
    setSaving(true)
    try {
      const candSalvo = await candidatoService.upsert(prepararPayloadCandidato(cpf, dadosPessoais))
      setCandidato(candSalvo)

      const payload = prepararPayloadEtapa2(cpf, edital.id, projetoPesquisa, inscricao)
      let inscricaoAtualizada
      if (payload.update) {
        inscricaoAtualizada = await inscricaoService.update(payload.id, payload.dados)
      } else {
        inscricaoAtualizada = await inscricaoService.create(payload.dados)
      }
      setInscricao(inscricaoAtualizada)
      setActiveStep(3)
      showMessage('Dados pessoais salvos com sucesso!', 'success')
    } catch {
      showMessage('Erro ao salvar dados pessoais.', 'error')
    } finally {
      setSaving(false)
    }
  }, [cpf, dadosPessoais, edital, inscricao, projetoPesquisa])

  const salvarEtapa3 = useCallback(async () => {
    if (!inscricao) return
    setSaving(true)
    try {
      const atualizada = await inscricaoService.update(inscricao.id, prepararPayloadEtapa3(dadosComplementares))
      setInscricao(atualizada)
      setActiveStep(4)
      showMessage('Dados de formação salvos com sucesso!', 'success')
    } catch {
      showMessage('Erro ao salvar dados de formação.', 'error')
    } finally {
      setSaving(false)
    }
  }, [dadosComplementares, inscricao])

  const finalizarInscricao = useCallback(async () => {
    if (!inscricao) return false
    setSaving(true)
    try {
      const atualizada = await inscricaoService.update(inscricao.id, prepararPayloadFinalizacao())
      setInscricao(atualizada)
      setInscricaoEnviada(true)
      return true
    } catch {
      showMessage('Erro ao finalizar inscrição. Tente novamente.', 'error')
      return false
    } finally {
      setSaving(false)
    }
  }, [inscricao])

  const voltarEtapa = useCallback(() => {
    setActiveStep((prev) => Math.max(0, prev - 1))
  }, [])

  const reiniciar = useCallback(() => {
    setActiveStep(0)
    setCpf('')
    setInscricao(null)
    setCandidato(null)
    setInscricaoHistorico(null)
    setDadosPessoais(getInitialDadosPessoais())
    setDadosComplementares(getInitialDadosComplementares())
    setProjetoPesquisa(getInitialProjetoPesquisa())
    setInscricaoEnviada(false)
    setMessage(null)
  }, [])

  return {
    activeStep,
    setActiveStep,
    cpf,
    setCpf,
    inscricao,
    candidato,
    dadosPessoais,
    setDadosPessoais,
    dadosComplementares,
    setDadosComplementares,
    projetoPesquisa,
    setProjetoPesquisa,
    saving,
    inscricaoEnviada,
    message,
    setMessage,
    showMessage,
    handleCpfSubmit,
    continuarInscricaoExistente,
    editarInscricaoExistente,
    iniciarNovaInscricao,
    salvarEtapa2,
    salvarEtapa3,
    finalizarInscricao,
    voltarEtapa,
    reiniciar,
    carregarDadosExistentes,
  }
}
