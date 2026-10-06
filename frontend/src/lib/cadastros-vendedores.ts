import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/lib/api'

/** Vendedor da prefeitura (Cadastros › Vendedores). Decimais chegam como texto ("3.50"). */
export type Vendedor = {
  id: number
  nome: string
  /** Só dígitos. */
  cpf: string
  /** `AAAA-MM-DD`. */
  data_admissao: string | null
  contato: { email: string | null; celular: string; telefone: string | null }
  comercial: { comissao: string; meta_mensal: string | null; regiao: string | null }
  observacoes: string | null
  ativo: boolean
}

/** Corpo do cadastro e da alteração: números de verdade. */
export type DadosDoVendedor = Omit<Vendedor, 'id' | 'comercial'> & {
  comercial: { comissao: number; meta_mensal: number | null; regiao: string | null }
}

const CHAVE = ['cadastros', 'vendedores']

export function useVendedores() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => (await api.get<{ data: Vendedor[] }>('/cadastros/vendedores')).data.data,
  })
}

/** Regiões já usadas, para sugestão no formulário. */
export function useRegioes() {
  return useQuery({
    queryKey: [...CHAVE, 'regioes'],
    queryFn: async () =>
      (await api.get<{ data: string[] }>('/cadastros/vendedores/regioes')).data.data,
  })
}

function useInvalidarVendedores() {
  const queryClient = useQueryClient()
  // Também as regiões: uma região nova passa a ser sugerida.
  return () => queryClient.invalidateQueries({ queryKey: CHAVE })
}

export function useCadastrarVendedor() {
  const invalidar = useInvalidarVendedores()
  return useMutation({
    mutationFn: async (vendedor: DadosDoVendedor) =>
      (await api.post<Vendedor>('/cadastros/vendedores', vendedor)).data,
    onSuccess: invalidar,
  })
}

export function useAlterarVendedor(id: number) {
  const invalidar = useInvalidarVendedores()
  return useMutation({
    mutationFn: async (vendedor: DadosDoVendedor) =>
      (await api.put<Vendedor>(`/cadastros/vendedores/${id}`, vendedor)).data,
    onSuccess: invalidar,
  })
}

export function useRemoverVendedor() {
  const invalidar = useInvalidarVendedores()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/cadastros/vendedores/${id}`),
    onSuccess: invalidar,
  })
}
