import axiosInstance from './axios.js'

export const editalService = {
  async findVigente() {
    const res = await axiosInstance.get('/editais/vigente')
    return res.data
  },

  async findProximo() {
    const res = await axiosInstance.get('/editais/proximo')
    return res.data
  },

  async findWithDocumentos(id) {
    const res = await axiosInstance.get(`/editais/${id}/documentos`)
    return res.data
  },
}
