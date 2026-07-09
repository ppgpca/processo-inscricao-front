import axiosInstance from './axios.js'

export const candidatoService = {
  async findByCpf(cpf) {
    try {
      const res = await axiosInstance.get(`/candidatos/${cpf}`)
      return res.data
    } catch (err) {
      if (err?.response?.status === 404) return null
      throw err
    }
  },

  async upsert(dto) {
    const res = await axiosInstance.post('/candidatos/upsert', dto)
    return res.data
  },
}
