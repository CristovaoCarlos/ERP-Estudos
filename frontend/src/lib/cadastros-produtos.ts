import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/lib/api'
import { somenteDigitos } from '@/lib/cpf'

/** Produto da prefeitura (Cadastros › Produtos). Decimais chegam como texto ("18.90"). */
export type Produto = {
  id: number
  /** Código interno (SKU), em maiúsculas. */
  codigo: string
  descricao: string
  /** GTIN/EAN, só dígitos. */
  codigo_barras: string | null
  /** Sigla de Administração › Tabelas Comuns › Unidades. */
  unidade: string
  categoria: string | null
  precos: { custo: string | null; venda: string; margem: number | null }
  estoque: { controla: boolean; atual: string; minimo: string | null; abaixo_do_minimo: boolean }
  fiscal: { ncm: string | null; cest: string | null; origem: number }
  pesos: { bruto: string | null; liquido: string | null }
  observacoes: string | null
  ativo: boolean
}

/**
 * Corpo do cadastro e da alteração: números de verdade, sem os campos calculados. O estoque atual
 * não vai: ele muda só pela entrada de notas (e pelas vendas).
 */
export type DadosDoProduto = Omit<Produto, 'id' | 'precos' | 'estoque' | 'pesos'> & {
  precos: { custo: number | null; venda: number }
  estoque: { controla: boolean; minimo: number | null }
  pesos: { bruto: number | null; liquido: number | null }
}

export type Opcao<V> = { valor: V; descricao: string }

export type OpcoesDeProdutos = {
  unidades: Opcao<string>[]
  origens: Opcao<number>[]
  /** Categorias já usadas, para sugestão. */
  categorias: string[]
}

const CHAVE = ['cadastros', 'produtos']

export function useProdutos() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => (await api.get<{ data: Produto[] }>('/cadastros/produtos')).data.data,
  })
}

export function useOpcoesDeProdutos() {
  return useQuery({
    queryKey: [...CHAVE, 'opcoes'],
    queryFn: async () => (await api.get<OpcoesDeProdutos>('/cadastros/produtos/opcoes')).data,
  })
}

function useInvalidarProdutos() {
  const queryClient = useQueryClient()
  // Também as opções: uma categoria nova passa a ser sugerida.
  return () => queryClient.invalidateQueries({ queryKey: CHAVE })
}

export function useCadastrarProduto() {
  const invalidar = useInvalidarProdutos()
  return useMutation({
    mutationFn: async (produto: DadosDoProduto) =>
      (await api.post<Produto>('/cadastros/produtos', produto)).data,
    onSuccess: invalidar,
  })
}

export function useAlterarProduto(id: number) {
  const invalidar = useInvalidarProdutos()
  return useMutation({
    mutationFn: async (produto: DadosDoProduto) =>
      (await api.put<Produto>(`/cadastros/produtos/${id}`, produto)).data,
    onSuccess: invalidar,
  })
}

export function useRemoverProduto() {
  const invalidar = useInvalidarProdutos()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/cadastros/produtos/${id}`),
    onSuccess: invalidar,
  })
}

/**
 * Código de barras GTIN (EAN-8, UPC-12, EAN-13, GTIN-14): 8, 12, 13 ou 14 dígitos, com o último
 * sendo o dígito verificador (módulo 10, pesos 3 e 1 da direita para a esquerda). Igual ao backend.
 */
export function gtinValido(valor: string): boolean {
  const gtin = valor.replace(/[\s.-]/g, '')
  if (!/^(\d{8}|\d{12,14})$/.test(gtin)) return false
  const soma = [...gtin.slice(0, -1)]
    .reverse()
    .reduce((total, digito, posicao) => total + Number(digito) * (posicao % 2 === 0 ? 3 : 1), 0)
  return (10 - (soma % 10)) % 10 === Number(gtin.at(-1))
}

/** NCM "09012100" → "0901.21.00", conforme o usuário digita. */
export function formatarNcm(valor: string): string {
  return somenteDigitos(valor)
    .slice(0, 8)
    .replace(/^(\d{4})(\d)/, '$1.$2')
    .replace(/^(\d{4})\.(\d{2})(\d)/, '$1.$2.$3')
}

/** CEST "1709600" → "17.096.00", conforme o usuário digita. */
export function formatarCest(valor: string): string {
  return somenteDigitos(valor)
    .slice(0, 7)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
}

/** Margem sobre o custo, em %: (venda − custo) ÷ custo. `null` sem custo. Igual ao backend. */
export function calcularMargem(custo: number | null, venda: number | null): number | null {
  if (!custo || custo <= 0 || venda === null || Number.isNaN(custo) || Number.isNaN(venda)) {
    return null
  }
  return Math.round(((venda - custo) / custo) * 10000) / 100
}
