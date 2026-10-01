import { useMutation } from '@tanstack/vue-query'
import axios from 'axios'

import { api } from '@/lib/api'

/** Pede o e-mail com o link de redefinição. O CPF vai sem máscara. */
export function usePedirRecuperacao() {
  return useMutation({
    mutationFn: async (cpf: string) =>
      (await api.post<{ message: string }>('/senha/esqueci', { cpf })).data,
  })
}

export type NovaSenha = {
  cpf: string
  token: string
  password: string
  password_confirmation: string
}

export function useRedefinirSenha() {
  return useMutation({
    mutationFn: async (dados: NovaSenha) =>
      (await api.post<{ message: string }>('/senha/redefinir', dados)).data,
  })
}

/** Mensagem do 422 (link inválido, senha curta) ou um aviso genérico. */
export function mensagemDeErroDaSenha(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 422) {
      const erros = (error.response.data?.errors ?? {}) as Record<string, string[]>
      return Object.values(erros)[0]?.[0] ?? 'Não foi possível concluir.'
    }
    if (error.response?.status === 429) {
      return 'Muitas tentativas. Aguarde um minuto e tente novamente.'
    }
  }
  return 'Não foi possível concluir. Tente novamente.'
}
