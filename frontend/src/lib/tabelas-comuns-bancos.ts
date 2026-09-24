import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Banco das tabelas comuns (banco central, igual para todas as prefeituras). */
export type Banco = {
  id: number
  /** Código de compensação (4 dígitos, com os zeros à esquerda). */
  codigo: string
  nome: string
}

export function useBancos() {
  return useQuery({
    queryKey: ['tabelas-comuns', 'bancos'],
    queryFn: async () => (await api.get<{ data: Banco[] }>('/tabelas-comuns/bancos')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}
