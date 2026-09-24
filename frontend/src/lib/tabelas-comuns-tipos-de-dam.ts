import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Tipo de DAM (banco central, igual para todas as prefeituras). */
export type DamTipo = {
  codigo: number
  descricao: string
}

export function useTiposDeDam() {
  return useQuery({
    queryKey: ['tabelas-comuns', 'tipos-de-dam'],
    queryFn: async () =>
      (await api.get<{ data: DamTipo[] }>('/tabelas-comuns/tipos-de-dam')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}
