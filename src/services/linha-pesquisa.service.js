import axiosInstance from './axios.js'

export const linhaPesquisaService = {
  async findAll() {
    const res = await axiosInstance.get('/linhas-pesquisa')
    return res.data
  },
}
