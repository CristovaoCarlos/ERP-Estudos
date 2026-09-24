import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Cidade das tabelas internas (banco central, igual para todas as prefeituras). */
export type Cidade = {
  id: number
  /** Código do município no IBGE (7 dígitos). */
  codigo_ibge: string
  nome: string
  uf: string
}

export function useCidades() {
  return useQuery({
    queryKey: ['administracao', 'tabelas-internas', 'cidades'],
    queryFn: async () =>
      (await api.get<{ data: Cidade[] }>('/administracao/tabelas-internas/cidades')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}
