import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/lib/api'

/** Unidade de medida dos produtos (tabelas comuns, banco central). A sigla é a chave. */
export type Unidade = { sigla: string; descricao: string }

const CHAVE = ['administracao', 'tabelas-comuns', 'unidades']

export function useUnidades() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () =>
      (await api.get<{ data: Unidade[] }>('/administracao/tabelas-comuns/unidades')).data.data,
    staleTime: Infinity,
  })
}

function useInvalidarUnidades() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: CHAVE })
    // O formulário de produtos lista as unidades nas opções.
    queryClient.invalidateQueries({ queryKey: ['cadastros', 'produtos', 'opcoes'] })
  }
}

/** Inclui uma unidade. Só o superadmin chega aqui: a tabela vale para todas as prefeituras. */
export function useCadastrarUnidade() {
  const invalidar = useInvalidarUnidades()
  return useMutation({
    mutationFn: async (dados: Unidade) =>
      (await api.post<Unidade>('/administracao/tabelas-comuns/unidades', dados)).data,
    onSuccess: invalidar,
  })
}

/** Altera a descrição. A sigla não muda: é ela que os produtos guardam. */
export function useAlterarUnidade(sigla: string) {
  const invalidar = useInvalidarUnidades()
  return useMutation({
    mutationFn: async (dados: { descricao: string }) =>
      (
        await api.put<Unidade>(
          `/administracao/tabelas-comuns/unidades/${encodeURIComponent(sigla)}`,
          dados,
        )
      ).data,
    onSuccess: invalidar,
  })
}
