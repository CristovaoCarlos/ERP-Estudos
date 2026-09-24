import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Tributos parametrizados, na ordem da tela. A chave é a mesma da API. */
export const tributos = [
  { chave: 'iss', rotulo: 'ISS' },
  { chave: 'taxa', rotulo: 'Taxa' },
  { chave: 'tll', rotulo: 'TLL' },
  { chave: 'irpf', rotulo: 'IRPF' },
  { chave: 'irpj', rotulo: 'IRPJ' },
  { chave: 'inss', rotulo: 'INSS' },
  { chave: 'itbi', rotulo: 'ITBI' },
  { chave: 'habite', rotulo: 'Habite-se' },
  { chave: 'iptu', rotulo: 'IPTU' },
  { chave: 'tcl', rotulo: 'TCL' },
  { chave: 'tcc', rotulo: 'TCC' },
  { chave: 'tip', rotulo: 'TIP' },
  { chave: 'tlp', rotulo: 'TLP' },
] as const

export type Tributo = (typeof tributos)[number]['chave']

export type Receita = { id: number; descricao: string; sigla: string | null }

/** Receita usada por cada tributo na prefeitura (um registro só). */
export type ParametroReceita = { receitas: Record<Tributo, number | null> }

export type DadosDoParametroReceita = { receitas: Partial<Record<Tributo, number | null>> }

const CHAVE = ['parametros', 'receitas']

export function useParametroReceita() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => (await api.get<ParametroReceita>('/parametros/receitas')).data,
  })
}

/** Receitas para os campos de seleção. */
export function useOpcoesParametroReceita() {
  return useQuery({
    queryKey: [...CHAVE, 'opcoes'],
    queryFn: async () =>
      (await api.get<{ receitas: Receita[] }>('/parametros/receitas/opcoes')).data,
  })
}

export function useSalvarParametroReceita() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: DadosDoParametroReceita) =>
      (await api.put<ParametroReceita>('/parametros/receitas', dados)).data,
    onSuccess: (salvo) => queryClient.setQueryData(CHAVE, salvo),
  })
}
