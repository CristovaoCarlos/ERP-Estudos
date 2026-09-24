import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Banco das tabelas internas (banco central, igual para todas as prefeituras). */
export type Banco = {
  id: number
  /** Código de compensação (4 dígitos, com os zeros à esquerda). */
  codigo: string
  nome: string
}

export function useBancos() {
  return useQuery({
    queryKey: ['administracao', 'tabelas-internas', 'bancos'],
    queryFn: async () =>
      (await api.get<{ data: Banco[] }>('/administracao/tabelas-internas/bancos')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}
