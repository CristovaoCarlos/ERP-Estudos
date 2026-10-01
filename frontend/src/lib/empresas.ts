import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import axios from 'axios'

import { api } from '@/lib/api'

/** Prefeitura cliente. Cadastrar uma empresa cria o endereço e o banco de dados dela. */
export type Empresa = {
  id: string
  nome: string | null
  cnpj: string | null
  dominio: string | null
  /** `provisionando` enquanto o worker cria e prepara o banco. */
  situacao: 'ativa' | 'provisionando'
  criada_em: string | null
}

export type NovaEmpresa = {
  nome: string
  /** Sem máscara. */
  cnpj: string
  subdominio: string
  /** Vira o usuário `admin_<subdominio>`, no grupo Administrador. */
  administrador: { cpf: string; email: string; senha: string }
}

export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas'],
    queryFn: async () => (await api.get<{ data: Empresa[] }>('/empresas')).data.data,
    // Atualiza sozinho até o provisionamento terminar.
    refetchInterval: (query) =>
      query.state.data?.some((empresa) => empresa.situacao === 'provisionando') ? 3000 : false,
  })
}

export function useCadastrarEmpresa() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (empresa: NovaEmpresa) =>
      (await api.post<Empresa>('/empresas', empresa)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['empresas'] }),
  })
}

/** Primeira mensagem de cada campo de um 422 do Laravel, ou `null` se o erro for outro. */
export function errosDosCampos(error: unknown): Record<string, string> | null {
  if (!axios.isAxiosError(error) || error.response?.status !== 422) return null
  const erros = (error.response.data?.errors ?? {}) as Record<string, string[]>
  return Object.fromEntries(
    Object.entries(erros).map(([campo, mensagens]) => [campo, mensagens[0]]),
  )
}
