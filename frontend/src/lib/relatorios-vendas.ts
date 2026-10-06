import { useQuery } from '@tanstack/vue-query'
import axios from 'axios'
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

/**
 * Baixa o PDF do relatório (gerado no servidor pela fachada de PDF). Um 422 chega como `Blob`: é
 * convertido em JSON para os erros caírem nos campos, como nas demais telas.
 */
export async function baixarPdfDoRelatorio(filtros: FiltrosDoRelatorio): Promise<void> {
  let arquivo: Blob
  try {
    arquivo = (
      await api.get<Blob>('/relatorios/vendas-periodo/pdf', {
        params: filtros,
        responseType: 'blob',
      })
    ).data
  } catch (erro) {
    if (axios.isAxiosError(erro) && erro.response?.data instanceof Blob) {
      try {
        erro.response.data = JSON.parse(await erro.response.data.text())
      } catch {
        // Corpo que não é JSON: segue como veio.
      }
    }
    throw erro
  }

  const endereco = URL.createObjectURL(arquivo)
  const link = document.createElement('a')
  link.href = endereco
  link.download = nomeDoPdf(filtros)
  link.click()
  setTimeout(() => URL.revokeObjectURL(endereco), 0)
}
