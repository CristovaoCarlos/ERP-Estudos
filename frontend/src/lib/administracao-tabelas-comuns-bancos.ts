import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Banco das tabelas comuns (banco central, igual para todas as prefeituras). */
export type Banco = {
  id: number
  /** Código de compensação (4 dígitos, com os zeros à esquerda). */
  codigo: string
  nome: string
}

const CHAVE = ['administracao', 'tabelas-comuns', 'bancos']

export function useBancos() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () =>
      (await api.get<{ data: Banco[] }>('/administracao/tabelas-comuns/bancos')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}

export type DadosDoBanco = { codigo: string; nome: string }

/** Inclui um registro. Só o superadmin chega aqui: a tabela vale para todas as prefeituras. */
export function useCadastrarBanco() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: DadosDoBanco) =>
      (await api.post<Banco>('/administracao/tabelas-comuns/bancos', dados)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}
