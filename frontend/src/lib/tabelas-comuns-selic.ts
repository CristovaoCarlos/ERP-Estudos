import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Taxa SELIC de um mês (banco central, igual para todas as prefeituras). */
export type Selic = {
  id: number
  ano: number
  /** 1 a 12. */
  mes: number
  /** Taxa do mês, em texto com 2 casas (ex.: `"0.87"`); `null` quando não informada. */
  valor: string | null
}

export function useSelic() {
  return useQuery({
    queryKey: ['tabelas-comuns', 'selic'],
    queryFn: async () => (await api.get<{ data: Selic[] }>('/tabelas-comuns/selic')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}
