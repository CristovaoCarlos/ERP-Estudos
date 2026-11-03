import { useQuery } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/lib/api'
import type { Situacao } from '@/lib/lancamentos-vendas'

/** Filtros do relatório, como vão na URL. */
export type FiltrosDoRelatorio = {
  inicio: string
  fim: string
  vendedor?: number
  cliente?: number
  forma_pagamento?: string
  incluir_canceladas: 0 | 1
}

/** Valores em texto com 2 casas ("1500.50"), como os da API. */
export type RelatorioDeVendas = {
  filtros: {
    inicio: string
    fim: string
    vendedor: { id: number; nome: string } | null
    cliente: { id: number; nome: string } | null
    forma_pagamento: string | null
    incluir_canceladas: boolean
  }
  resumo: {
    quantidade: number
    subtotal: string
    descontos: string
    total: string
    ticket_medio: string
    canceladas: { quantidade: number; total: string }
  }
  por_pagamento: { forma_pagamento: string; descricao: string; quantidade: number; total: string }[]
  por_vendedor: {
    id: number
    nome: string
    quantidade: number
    total: string
    comissao_percentual: string
    comissao: string
  }[]
  vendas: {
    id: number
    data: string
    cliente: { id: number; nome: string; tipo_pessoa: 'F' | 'J'; cpf_cnpj: string }
    vendedor: { id: number; nome: string }
    forma_pagamento: string
    itens: number
    subtotal: string
    desconto: string
    total: string
    situacao: Situacao
  }[]
}

export type OpcoesDoRelatorio = {
  formas_de_pagamento: { valor: string; descricao: string }[]
  clientes: { id: number; nome: string; tipo_pessoa: 'F' | 'J'; cpf_cnpj: string }[]
  vendedores: { id: number; nome: string }[]
}

const CHAVE = ['relatorios', 'vendas-periodo']

/** Vendedores, clientes (inclusive inativos) e formas de pagamento, para os filtros. */
export function useOpcoesDoRelatorio() {
  return useQuery({
    queryKey: [...CHAVE, 'opcoes'],
    queryFn: async () =>
      (await api.get<OpcoesDoRelatorio>('/relatorios/vendas-periodo/opcoes')).data,
  })
}

/** O relatório dos filtros aplicados; nada é buscado antes de "Gerar" (`null`). */
export function useRelatorioDeVendas(filtros: MaybeRefOrGetter<FiltrosDoRelatorio | null>) {
  return useQuery({
    queryKey: computed(() => [...CHAVE, toValue(filtros)]),
    queryFn: async () =>
      (
        await api.get<RelatorioDeVendas>('/relatorios/vendas-periodo', {
          params: toValue(filtros),
        })
      ).data,
    enabled: computed(() => toValue(filtros) !== null),
  })
}

/** Nome do PDF, igual ao do servidor: `vendas-2026-10-01-a-2026-10-31.pdf`. */
export function nomeDoPdf(filtros: FiltrosDoRelatorio): string {
  return `vendas-${filtros.inicio}-a-${filtros.fim}.pdf`
}

/** Pedido de PDF gerado em segundo plano, como a API devolve. */
export type PedidoDePdf = {
  id: number
  situacao: 'pendente' | 'processando' | 'pronto' | 'falhou'
  erro: string | null
  concluido_em: string | null
}

/** O worker terminou o pedido sem gerar o arquivo; `message` é o texto do servidor para a tela. */
export class FalhaNoPdf extends Error {}

const esperar = (ms: number) => new Promise((resolver) => setTimeout(resolver, ms))

/**
 * Baixa o PDF do relatório, que o servidor gera em segundo plano (fila): pede (`POST`, responde
 * 202 com o id), consulta a situação a cada `intervalo` ms até ficar pronto e baixa o arquivo. Um
 * 422 do pedido vem em JSON e cai nos campos, como nas demais telas.
 */
export async function baixarPdfDoRelatorio(
  filtros: FiltrosDoRelatorio,
  intervalo = 1500,
): Promise<void> {
  let pedido = (await api.post<PedidoDePdf>('/relatorios/vendas-periodo/pdf', filtros)).data
  const limite = Date.now() + 5 * 60 * 1000

  while (pedido.situacao === 'pendente' || pedido.situacao === 'processando') {
    if (Date.now() > limite) throw new FalhaNoPdf('O PDF está demorando. Tente de novo mais tarde.')
    await esperar(intervalo)
    pedido = (await api.get<PedidoDePdf>(`/relatorios/vendas-periodo/pdf/${pedido.id}`)).data
  }
  if (pedido.situacao === 'falhou') {
    throw new FalhaNoPdf(pedido.erro ?? 'Não foi possível gerar o PDF.')
  }

  const arquivo = (
    await api.get<Blob>(`/relatorios/vendas-periodo/pdf/${pedido.id}/arquivo`, {
      responseType: 'blob',
    })
  ).data
  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = endereco
  link.download = nomeDoPdf(filtros)
  link.click()
  setTimeout(() => URL.revokeObjectURL(endereco), 0)
}
