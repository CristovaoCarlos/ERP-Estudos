import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Segmento de arrecadação da FEBRABAN (banco central). */
export type Segmento = {
  /** Um dígito, usado no código de barras. */
  codigo: string
  descricao: string
}

const CHAVE = ['tabelas-comuns', 'segmentos']

export function useSegmentos() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () =>
      (await api.get<{ data: Segmento[] }>('/tabelas-comuns/segmentos')).data.data,
    // Tabela de apoio que quase não muda: só busca de novo depois de uma alteração.
    staleTime: Infinity,
  })
}

export function useAlterarSegmento(codigo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: { descricao: string }) =>
      (await api.put<Segmento>(`/tabelas-comuns/segmentos/${codigo}`, dados)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}
