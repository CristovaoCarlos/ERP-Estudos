import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Item ou subitem da lista de serviços da LC 116/2003 (banco central). */
export type ItemLcp116 = {
  /** `01` (item) ou `01.01` (subitem). */
  codigo: string
  tipo: 'item' | 'subitem'
  descricao: string
}

const CHAVE = ['administracao', 'tabelas-comuns', 'lista-de-servicos']

export function useListaDeServicos() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () =>
      (await api.get<{ data: ItemLcp116[] }>('/administracao/tabelas-comuns/lista-de-servicos'))
        .data.data,
    // Tabela de apoio que quase não muda: só busca de novo depois de uma alteração.
    staleTime: Infinity,
  })
}

export function useAlterarItemLcp116(codigo: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: { descricao: string }) =>
      (
        await api.put<ItemLcp116>(
          `/administracao/tabelas-comuns/lista-de-servicos/${codigo}`,
          dados,
        )
      ).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}

export type DadosDoItemLcp116 = { codigo: string; descricao: string }

/** Inclui um registro. Só o superadmin chega aqui: a tabela vale para todas as prefeituras. */
export function useCadastrarItemLcp116() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: DadosDoItemLcp116) =>
      (await api.post<ItemLcp116>('/administracao/tabelas-comuns/lista-de-servicos', dados)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}
