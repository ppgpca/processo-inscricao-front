import axiosInstance from './axios.js'

export const documentoService = {
  async findByInscricao(idInscricao) {
    const res = await axiosInstance.get(`/documentos/inscricao/${idInscricao}`)
    return res.data
  },

  async upload(idInscricao, idTipoDocumentoEdital, arquivo) {
    const formData = new FormData()
    formData.append('arquivo', arquivo)
    const res = await axiosInstance.post(
      `/documentos/inscricao/${idInscricao}/tipo/${idTipoDocumentoEdital}`,
      formData,
    )
    return res.data
  },

  async remover(idInscricao, idTipoDocumentoEdital) {
    await axiosInstance.delete(
      `/documentos/inscricao/${idInscricao}/tipo/${idTipoDocumentoEdital}`,
    )
  },

  getDownloadUrl(idInscricao, idTipoDocumentoEdital) {
    const base = axiosInstance.defaults.baseURL ?? ''
    return `${base}/documentos/inscricao/${idInscricao}/tipo/${idTipoDocumentoEdital}/download`
  },
}
