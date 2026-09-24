import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Tipo de numeração da nota fiscal (banco central, igual para todas as prefeituras). */
export type NotaNumeracao = {
  /** Uma letra (ex.: `A` automático, `D` por data, `N` normal). */
  codigo: string
  descricao: string
}

export function useNumeracaoDeNotas() {
  return useQuery({
    queryKey: ['tabelas-comuns', 'numeracao-de-notas'],
    queryFn: async () =>
      (await api.get<{ data: NotaNumeracao[] }>('/tabelas-comuns/numeracao-de-notas')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}
