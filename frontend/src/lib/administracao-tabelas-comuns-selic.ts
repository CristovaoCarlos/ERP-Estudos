import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

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

const CHAVE = ['administracao', 'tabelas-comuns', 'selic']

export function useSelic() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () =>
      (await api.get<{ data: Selic[] }>('/administracao/tabelas-comuns/selic')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}

export type DadosDaSelic = { ano: number; mes: number; valor: string | null }

/** Inclui um registro. Só o superadmin chega aqui: a tabela vale para todas as prefeituras. */
export function useCadastrarSelic() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: DadosDaSelic) =>
      (await api.post<Selic>('/administracao/tabelas-comuns/selic', dados)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}
