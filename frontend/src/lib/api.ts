import axios from 'axios'

const TOKEN_KEY = 'stm.token'

export const api = axios.create({
  baseURL: '/api',
  headers: { Accept: 'application/json' },
})

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

api.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(undefined, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && getToken()) {
    setToken(null)
    if (window.location.pathname !== '/login') window.location.assign('/login')
  }
  return Promise.reject(error)
})
