import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/lib/api'

/** Tipo de DAM (banco central, igual para todas as prefeituras). */
export type DamTipo = {
  codigo: number
  descricao: string
}

const CHAVE = ['administracao', 'tabelas-comuns', 'tipos-de-dam']

export function useTiposDeDam() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () =>
      (await api.get<{ data: DamTipo[] }>('/administracao/tabelas-comuns/tipos-de-dam')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}

export type DadosDoDamTipo = { codigo: number; descricao: string }

/** Inclui um registro. Só o superadmin chega aqui: a tabela vale para todas as prefeituras. */
export function useCadastrarDamTipo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (dados: DadosDoDamTipo) =>
      (await api.post<DamTipo>('/administracao/tabelas-comuns/tipos-de-dam', dados)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}
