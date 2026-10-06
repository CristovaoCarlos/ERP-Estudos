import axios from 'axios'
import { ref } from 'vue'

export const TOKEN_KEY = 'erp_estudos.token'

/** Token da sessão. Reativo: telas e consultas reagem ao login e ao logout. */
const token = ref(localStorage.getItem(TOKEN_KEY))

/** Momento (ms) da última requisição autenticada: o servidor conta a inatividade a partir dela. */
let ultimaRequisicao = 0

// Login ou logout em outra aba vale para esta também.
window.addEventListener('storage', (evento) => {
  if (evento.key === TOKEN_KEY) token.value = evento.newValue
})

export const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

export function getToken() {
  return token.value
}

export function getUltimaRequisicao() {
  return ultimaRequisicao
}

/** Marca uma requisição autenticada agora (chamada pelo interceptor; exportada para os testes). */
export function registrarRequisicao() {
  ultimaRequisicao = Date.now()
}

export function setToken(novo: string | null) {
  token.value = novo
  if (novo) localStorage.setItem(TOKEN_KEY, novo)
  else localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const atual = getToken()
  if (atual) {
    config.headers.Authorization = `Bearer ${atual}`
    registrarRequisicao()
  }
  return config
})

api.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && getToken()) {
    setToken(null)
    // O servidor recusou o token: revogado ou expirado por inatividade (ver `lib/sessao.ts`).
    if (window.location.pathname !== '/login') window.location.assign('/login?sessao=expirada')
  }
  return Promise.reject(error)
})
