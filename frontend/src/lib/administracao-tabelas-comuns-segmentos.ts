import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/lib/api'

/** Segmento de arrecadação da FEBRABAN (banco central). */
export type Segmento = {
  /** Um dígito, usado no código de barras. */
  codigo: string
  descricao: string
}

const CHAVE = ['administracao', 'tabelas-comuns', 'segmentos']

export function useSegmentos() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () =>
      (await api.get<{ data: Segmento[] }>('/administracao/tabelas-comuns/segmentos')).data.data,
    // Tabela de apoio que quase não muda: só busca de novo depois de uma alteração.
    staleTime: Infinity,
  })
}

export function useAlterarSegmento(codigo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: { descricao: string }) =>
      (await api.put<Segmento>(`/administracao/tabelas-comuns/segmentos/${codigo}`, dados)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}

export type DadosDoSegmento = { codigo: string; descricao: string }

/** Inclui um registro. Só o superadmin chega aqui: a tabela vale para todas as prefeituras. */
export function useCadastrarSegmento() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: DadosDoSegmento) =>
      (await api.post<Segmento>('/administracao/tabelas-comuns/segmentos', dados)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}
