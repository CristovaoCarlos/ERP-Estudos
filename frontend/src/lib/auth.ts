import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'

import { api, getToken, setToken } from '@/lib/api'

export type PrefeituraDoUsuario = {
  id: string
  dominio: string | null
}

export type Usuario = {
  id: number
  name: string
  cpf: string | null
  email: string
  prefeituras: PrefeituraDoUsuario[]
}

export type Credenciais = {
  /** Só dígitos. */
  cpf: string
  password: string
}

export function useUsuario() {
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => (await api.get<Usuario>('/me')).data,
    enabled: getToken() !== null,
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
  const navigate = useNavigate()
  return useMutation({
    mutationFn: () => api.post('/logout'),
    onSettled: () => {
      setToken(null)
      queryClient.clear()
      navigate('/login', { replace: true })
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
