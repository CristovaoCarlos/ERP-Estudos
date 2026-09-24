import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Tipo de numeração da nota fiscal (banco central, igual para todas as prefeituras). */
export type NotaNumeracao = {
  /** Uma letra (ex.: `A` automático, `D` por data, `N` normal). */
  codigo: string
  descricao: string
}

const CHAVE = ['administracao', 'tabelas-comuns', 'numeracao-de-notas']

export function useNumeracaoDeNotas() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () =>
      (await api.get<{ data: NotaNumeracao[] }>('/administracao/tabelas-comuns/numeracao-de-notas'))
        .data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}

export type DadosDaNotaNumeracao = { codigo: string; descricao: string }

/** Inclui um registro. Só o superadmin chega aqui: a tabela vale para todas as prefeituras. */
export function useCadastrarNotaNumeracao() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: DadosDaNotaNumeracao) =>
      (await api.post<NotaNumeracao>('/administracao/tabelas-comuns/numeracao-de-notas', dados))
        .data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}
