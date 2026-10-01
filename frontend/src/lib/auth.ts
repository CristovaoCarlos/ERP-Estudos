import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'
import { computed } from 'vue'
import { useRouter } from 'vue-router'

import { api, getToken, setToken } from '@/lib/api'

export type PrefeituraDoUsuario = {
  id: string
  nome: string | null
  dominio: string | null
}

export type Usuario = {
  id: number
  name: string
  cpf: string | null
  email: string
  /** Endereço da foto (`/api/fotos/...`) ou `null`. */
  foto: string | null
  /** Superadmin com efeito nesta prefeitura (só na prefeitura administradora). */
  superadmin: boolean
  /** Grupos de acesso nesta prefeitura. */
  grupos: string[]
  /** Permissões nesta prefeitura: uma por tela (ver `permissaoDaTela`). */
  permissoes: string[]
  prefeituras: PrefeituraDoUsuario[]
}

export type Credenciais = {
  /** Só dígitos. */
  cpf: string
  password: string
}

/** "Maria Souza Lima" → "ML" (primeiro e último nome). */
export function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/)
  return (
    (partes[0]?.[0] ?? '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')
  ).toUpperCase()
}

export function useUsuario() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<Usuario>('/me')).data,
    enabled: computed(() => getToken() !== null),
    retry: false,
    staleTime: Infinity,
  })
}

export function useLogin() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (credenciais: Credenciais) =>
      (await api.post<{ token: string; usuario: Usuario }>('/login', credenciais)).data,
    onSuccess: ({ token, usuario }) => {
      setToken(token)
      queryClient.setQueryData(['me'], usuario)
    },
  })
}

export function useLogout() {
  const queryClient = useQueryClient()
  const router = useRouter()
  return useMutation({
    mutationFn: () => api.post('/logout'),
    onSettled: () => {
      setToken(null)
      queryClient.clear()
      router.replace('/login')
    },
  })
}

export function mensagemDeErroDoLogin(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 422) {
      return error.response.data?.errors?.cpf?.[0] ?? 'CPF ou senha inválidos.'
    }
    if (error.response?.status === 429) {
      return 'Muitas tentativas de login. Aguarde um minuto e tente novamente.'
    }
  }
  return 'Não foi possível entrar. Tente novamente.'
}
