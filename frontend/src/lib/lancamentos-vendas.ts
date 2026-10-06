import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'

import { api } from '@/lib/api'

export type Situacao = 'finalizada' | 'cancelada'

/** Item como ficou gravado na venda: código, descrição, unidade e preço da data da venda. */
export type ItemDaVenda = {
  id: number
  produto: number
  codigo: string
  descricao: string
  unidade: string
  /** Decimais chegam como texto ("1.255", "39.90"). */
  quantidade: string
  preco_unitario: string
  desconto: string
  total: string
  /** Saiu do estoque na venda (e volta no cancelamento). */
  baixou_estoque: boolean
}

/** Venda da prefeitura (Lançamentos › Vendas). Registrada, não se altera: só se cancela. */
export type Venda = {
  id: number
  /** `AAAA-MM-DD`. */
  data: string
  cliente: { id: number; nome: string; tipo_pessoa: 'F' | 'J'; cpf_cnpj: string }
  vendedor: { id: number; nome: string }
  forma_pagamento: string
  subtotal: string
  desconto: string
  total: string
  observacoes: string | null
  situacao: Situacao
  registrada_em: string
  cancelada_em: string | null
  itens: ItemDaVenda[]
}

/** Corpo do registro: ids e números de verdade. Os totais o servidor calcula. */
export type DadosDaVenda = {
  data: string
  cliente: number
  vendedor: number
  forma_pagamento: string
  desconto: number
  observacoes: string | null
  itens: { produto: number; quantidade: number; preco_unitario: number; desconto: number }[]
}

/** Produto ativo que pode entrar na venda, com o saldo de estoque. */
export type ProdutoParaVenda = {
  id: number
  codigo: string
  descricao: string
  codigo_barras: string | null
  unidade: string
  preco_venda: string
  controla_estoque: boolean
  estoque_atual: string
}

export type OpcoesDaVenda = {
  formas_de_pagamento: { valor: string; descricao: string }[]
  clientes: { id: number; nome: string; tipo_pessoa: 'F' | 'J'; cpf_cnpj: string }[]
  vendedores: { id: number; nome: string }[]
  produtos: ProdutoParaVenda[]
}

/** Formas de pagamento (as mesmas de `Venda::FORMAS_DE_PAGAMENTO`), para a listagem. */
export const FORMAS_DE_PAGAMENTO: Record<string, string> = {
  dinheiro: 'Dinheiro',
  pix: 'Pix',
  cartao_debito: 'Cartão de débito',
  cartao_credito: 'Cartão de crédito',
  boleto: 'Boleto',
  crediario: 'Crediário',
}

/** Produto sem saldo para vender: controla estoque e não tem nada. */
export function semEstoque(produto: ProdutoParaVenda): boolean {
  return produto.controla_estoque && Number(produto.estoque_atual) <= 0
}

/** Venda nº 42 → "000042". */
export function numeroDaVenda(id: number): string {
  return String(id).padStart(6, '0')
}

/** "2026-10-06" → "06/10/2026", sem passar por `Date` (que mudaria o dia pelo fuso). */
export function formatarData(data: string): string {
  const [ano, mes, dia] = data.split('-')
  return `${dia}/${mes}/${ano}`
}

/** Data e hora ISO → "06/10/2026 14:35", no fuso do navegador. */
export function formatarDataHora(iso: string): string {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
    .format(new Date(iso))
    .replace(',', '')
}

const CHAVE = ['lancamentos', 'vendas']

export function useVendas() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => (await api.get<{ data: Venda[] }>('/lancamentos/vendas')).data.data,
  })
}

/**
 * Clientes, vendedores e produtos ativos, com o saldo de estoque. Sempre busca de novo ao abrir o
 * formulário: o saldo muda a cada venda.
 */
export function useOpcoesDaVenda() {
  return useQuery({
    queryKey: [...CHAVE, 'opcoes'],
    queryFn: async () => (await api.get<OpcoesDaVenda>('/lancamentos/vendas/opcoes')).data,
    staleTime: 0,
  })
}

function useInvalidarVendas() {
  const queryClient = useQueryClient()
  // A venda mexe no estoque: o cadastro de produtos também fica desatualizado.
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: CHAVE }),
      queryClient.invalidateQueries({ queryKey: ['cadastros', 'produtos'] }),
    ])
}

export function useRegistrarVenda() {
  const invalidar = useInvalidarVendas()
  return useMutation({
    mutationFn: async (venda: DadosDaVenda) =>
      (await api.post<Venda>('/lancamentos/vendas', venda)).data,
    onSuccess: invalidar,
  })
}

export function useCancelarVenda() {
  const invalidar = useInvalidarVendas()
  return useMutation({
    mutationFn: async (id: number) =>
      (await api.post<Venda>(`/lancamentos/vendas/${id}/cancelar`)).data,
    onSuccess: invalidar,
  })
}
