import { useCallback, useState } from 'react'

import { candidatoService } from '../services/candidato.service.js'
import { inscricaoService } from '../services/inscricao.service.js'

const initialDadosPessoais = {
  nome: '',
  dataNascimento: '',
  rg: '',
  telefone: '',
  celular: '',
  email: '',
  email2: '',
  enderecoRua: '',
  enderecoNum: '',
  enderecoBairro: '',
  enderecoCidade: '',
  enderecoEstado: '',
  enderecoCep: '',
}

const initialDadosComplementares = {
  graduacao1: { curso: '', instituicao: '', anoConclusao: '' },
  graduacao2: { curso: '', instituicao: '', anoConclusao: '' },
  ocupacaoProfissional: { instituicao: '', cargo: '', telefone: '' },
}

const initialProjetoPesquisa = {
  idLinhaPesquisa: '',
  projetoPesquisa: '',
  deficiente: false,
  indigena: false,
  pretoPardo: false,
}

export function useInscricao(edital) {
  const [activeStep, setActiveStep] = useState(0)
  const [cpf, setCpf] = useState('')
  const [inscricao, setInscricao] = useState(null)
  const [candidato, setCandidato] = useState(null)
  const [inscricaoHistorico, setInscricaoHistorico] = useState(null)
  const [dadosPessoais, setDadosPessoais] = useState(initialDadosPessoais)
  const [dadosComplementares, setDadosComplementares] = useState(initialDadosComplementares)
  const [projetoPesquisa, setProjetoPesquisa] = useState(initialProjetoPesquisa)
  const [saving, setSaving] = useState(false)
  const [inscricaoEnviada, setInscricaoEnviada] = useState(false)
  const [message, setMessage] = useState(null)

  const showMessage = (text, severity = 'success') => {
    setMessage({ text, severity })
  }

  const carregarDadosExistentes = useCallback((insc, cand) => {
    if (cand) {
      setDadosPessoais({
        nome: cand.nome ?? '',
        dataNascimento: cand.dataNascimento ?? '',
        rg: cand.rg ?? '',
        telefone: cand.telefone ?? '',
        celular: cand.celular ?? '',
        email: cand.email ?? '',
        email2: cand.email2 ?? '',
        enderecoRua: cand.enderecoRua ?? '',
        enderecoNum: cand.enderecoNum ?? '',
        enderecoBairro: cand.enderecoBairro ?? '',
        enderecoCidade: cand.enderecoCidade ?? '',
        enderecoEstado: cand.enderecoEstado ?? '',
        enderecoCep: cand.enderecoCep ?? '',
      })
    }

    if (insc.dadosComplementares) {
      const dc = insc.dadosComplementares
      setDadosComplementares({
        graduacao1: dc.graduacao1 ?? { curso: '', instituicao: '', anoConclusao: '' },
        graduacao2: dc.graduacao2 ?? { curso: '', instituicao: '', anoConclusao: '' },
        ocupacaoProfissional: dc.ocupacaoProfissional ?? { instituicao: '', cargo: '', telefone: '' },
      })
    }

    setProjetoPesquisa({
      idLinhaPesquisa: insc.idLinhaPesquisa ?? '',
      projetoPesquisa: insc.projetoPesquisa ?? '',
      deficiente: insc.deficiente ?? false,
      indigena: insc.indigena ?? false,
      pretoPardo: insc.pretoPardo ?? false,
    })
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

      const etapaParaStep = { 1: 1, 2: 3, 3: 4, 4: 4 }
      const etapaUi = etapaParaStep[insc.etapa ?? 1] ?? 1
      setActiveStep(etapaUi)
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
        setDadosPessoais({
          nome: candExistente.nome ?? '',
          dataNascimento: candExistente.dataNascimento ?? '',
          rg: candExistente.rg ?? '',
          telefone: candExistente.telefone ?? '',
          celular: candExistente.celular ?? '',
          email: candExistente.email ?? '',
          email2: candExistente.email2 ?? '',
          enderecoRua: candExistente.enderecoRua ?? '',
          enderecoNum: candExistente.enderecoNum ?? '',
          enderecoBairro: candExistente.enderecoBairro ?? '',
          enderecoCidade: candExistente.enderecoCidade ?? '',
          enderecoEstado: candExistente.enderecoEstado ?? '',
          enderecoCep: candExistente.enderecoCep ?? '',
        })
        setCandidato(candExistente)
      }

      const fonteDc =
        inscricaoAnterior?.dadosComplementares ??
        inscricaoHistoricoParam?.dadosComplementares ??
        inscricaoHistorico?.dadosComplementares
      if (fonteDc) {
        setDadosComplementares({
          graduacao1: fonteDc.graduacao1 ?? { curso: '', instituicao: '', anoConclusao: '' },
          graduacao2: fonteDc.graduacao2 ?? { curso: '', instituicao: '', anoConclusao: '' },
          ocupacaoProfissional: fonteDc.ocupacaoProfissional ?? { instituicao: '', cargo: '', telefone: '' },
        })
      } else {
        setDadosComplementares(initialDadosComplementares)
      }

      setProjetoPesquisa(initialProjetoPesquisa)
      setInscricao(null)
      setActiveStep(1)
    },
    [edital, inscricaoHistorico],
  )

  const salvarEtapa2 = useCallback(async () => {
    if (!edital) return
    setSaving(true)
    try {
      const candSalvo = await candidatoService.upsert({
        cpf,
        nome: dadosPessoais.nome,
        dataNascimento: dadosPessoais.dataNascimento,
        rg: dadosPessoais.rg || undefined,
        telefone: dadosPessoais.telefone || undefined,
        celular: dadosPessoais.celular || undefined,
        email: dadosPessoais.email,
        email2: dadosPessoais.email2 || undefined,
        enderecoRua: dadosPessoais.enderecoRua || undefined,
        enderecoNum: dadosPessoais.enderecoNum || undefined,
        enderecoBairro: dadosPessoais.enderecoBairro || undefined,
        enderecoCidade: dadosPessoais.enderecoCidade || undefined,
        enderecoEstado: dadosPessoais.enderecoEstado || undefined,
        enderecoCep: dadosPessoais.enderecoCep || undefined,
      })
      setCandidato(candSalvo)

      const dadosLinha = {
        idLinhaPesquisa: projetoPesquisa.idLinhaPesquisa ? Number(projetoPesquisa.idLinhaPesquisa) : undefined,
        projetoPesquisa: projetoPesquisa.projetoPesquisa || undefined,
        deficiente: projetoPesquisa.deficiente,
        indigena: projetoPesquisa.indigena,
        pretoPardo: projetoPesquisa.pretoPardo,
      }

      let inscricaoAtualizada
      if (inscricao) {
        inscricaoAtualizada = await inscricaoService.update(inscricao.id, { etapa: 2, ...dadosLinha })
      } else {
        inscricaoAtualizada = await inscricaoService.create({
          cpf,
          idEdital: edital.id,
          etapa: 2,
          ...dadosLinha,
        })
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
      const atualizada = await inscricaoService.update(inscricao.id, {
        etapa: 3,
        dadosComplementares,
      })
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
      const atualizada = await inscricaoService.update(inscricao.id, {
        etapa: 5,
        dataEnvio: new Date().toISOString(),
      })
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
    setDadosPessoais(initialDadosPessoais)
    setDadosComplementares(initialDadosComplementares)
    setProjetoPesquisa(initialProjetoPesquisa)
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
