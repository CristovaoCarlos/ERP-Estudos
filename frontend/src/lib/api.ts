import axios from 'axios'
import { ref } from 'vue'

const TOKEN_KEY = 'erp_estudos.token'

/** Token da sessão. Reativo: telas e consultas reagem ao login e ao logout. */
const token = ref(localStorage.getItem(TOKEN_KEY))

export const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

export function getToken() {
  return token.value
}

export function setToken(novo: string | null) {
  token.value = novo
  if (novo) localStorage.setItem(TOKEN_KEY, novo)
  else localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const atual = getToken()
  if (atual) config.headers.Authorization = `Bearer ${atual}`
  return config
})

api.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && getToken()) {
    setToken(null)
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  return Promise.reject(error)
})
