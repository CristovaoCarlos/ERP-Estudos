import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Cidade das tabelas comuns (banco central, igual para todas as prefeituras). */
export type Cidade = {
  id: number
  /** Código do município no IBGE (7 dígitos). */
  codigo_ibge: string
  nome: string
  uf: string
}

const CHAVE = ['administracao', 'tabelas-comuns', 'cidades']

export function useCidades() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () =>
      (await api.get<{ data: Cidade[] }>('/administracao/tabelas-comuns/cidades')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}

export type DadosDaCidade = { codigo_ibge: string; nome: string; uf: string }

/** Inclui um registro. Só o superadmin chega aqui: a tabela vale para todas as prefeituras. */
export function useCadastrarCidade() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: DadosDaCidade) =>
      (await api.post<Cidade>('/administracao/tabelas-comuns/cidades', dados)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}

export type AlteracaoDaCidade = { nome: string; uf: string }

/** Altera nome e UF. O código do IBGE não muda. */
export function useAlterarCidade(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: AlteracaoDaCidade) =>
      (await api.put<Cidade>(`/administracao/tabelas-comuns/cidades/${id}`, dados)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}
