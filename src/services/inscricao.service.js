import axiosInstance from './axios.js'

export const inscricaoService = {
  async findByCpfEdital(cpf, idEdital) {
    const res = await axiosInstance.get('/inscricoes/buscar', {
      params: { cpf, idEdital },
    })
    return res.data
  },

  async create(dto) {
    const res = await axiosInstance.post('/inscricoes', dto)
    return res.data
  },

  async update(id, dto) {
    const res = await axiosInstance.put(`/inscricoes/${id}`, dto)
    return res.data
  },

  async desativar(id) {
    await axiosInstance.put(`/inscricoes/${id}/desativar`)
  },
}
