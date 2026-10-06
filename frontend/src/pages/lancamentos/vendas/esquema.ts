import { z } from 'zod'

import type { DadosDaVenda, ProdutoParaVenda } from '@/lib/lancamentos-vendas'
import { formatarQuantidade, lerValor, paraCampo } from '@/lib/numeros'

/**
 * Item no formulário. Além do que vai para a API, guarda os dados do produto no momento em que
 * entrou na venda (descrição, unidade, saldo), para mostrar a linha e conferir o estoque.
 */
const esquemaDoItem = z.object({
  produto: z.number(),
  codigo: z.string(),
  descricao: z.string(),
  unidade: z.string(),
  controla_estoque: z.boolean(),
  /** Saldo do produto ao abrir o formulário. */
  disponivel: z.string(),
  quantidade: z.string(),
  preco_unitario: z.string(),
  desconto: z.string(),
})

export type ItemDoFormulario = z.input<typeof esquemaDoItem>

/** Data de hoje (`AAAA-MM-DD`) no fuso do navegador. */
export function hoje(): string {
  const agora = new Date()
  return new Date(agora.getTime() - agora.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

/**
 * Valor de um item em centavos: quantidade × preço, meio centavo para cima, menos o desconto. Conta
 * com inteiros (BigInt), sem os erros do float, como o backend faz com bcmath. `null` se algum
 * número for inválido.
 */
export function centavosDoItem(
  item: Pick<ItemDoFormulario, 'quantidade' | 'preco_unitario' | 'desconto'>,
) {
  const quantidade = lerValor(item.quantidade, { casas: 3 })
  const preco = lerValor(item.preco_unitario)
  const desconto = lerValor(item.desconto) ?? 0
  if (quantidade === null || preco === null || [quantidade, preco, desconto].some(Number.isNaN)) {
    return null
  }
  const milesimos = BigInt(Math.round(quantidade * 1000))
  const centavos = BigInt(Math.round(preco * 100))
  const bruto = Number((milesimos * centavos + 500n) / 1000n)
  return { bruto, total: bruto - Math.round(desconto * 100) }
}

/** Subtotal (soma dos itens) e total (menos o desconto da venda), em centavos. */
export function totaisDaVenda(dados: { itens: ItemDoFormulario[]; desconto: string }) {
  const subtotal = dados.itens.reduce((soma, item) => soma + (centavosDoItem(item)?.total ?? 0), 0)
  const desconto = lerValor(dados.desconto)
  const descontoEmCentavos = desconto && !Number.isNaN(desconto) ? Math.round(desconto * 100) : 0
  return { subtotal, total: subtotal - descontoEmCentavos }
}

/** Mensagem de falta de estoque, igual à do backend. */
export function mensagemDeEstoque(item: ItemDoFormulario): string {
  return Number(item.disponivel) <= 0
    ? `${item.descricao} está sem estoque.`
    : `Estoque insuficiente: há ${formatarQuantidade(item.disponivel)} ${item.unidade} de ${item.descricao}.`
}

/**
 * Formulário de nova venda. Confere o mesmo que o servidor: itens, quantidades, descontos e o
 * estoque (somando o mesmo produto em mais de um item). O servidor confere de novo com o saldo do
 * momento, que pode ter mudado com outra venda.
 */
export const esquemaDaVenda = z
  .object({
    data: z.string(),
    /** Ids do cliente e do vendedor em texto (vazio: não escolhido). */
    cliente: z.string(),
    vendedor: z.string(),
    forma_pagamento: z.string(),
    desconto: z.string(),
    observacoes: z.string().max(5000, 'Use no máximo 5.000 caracteres.'),
    itens: z.array(esquemaDoItem),
  })
  .superRefine((dados, ctx) => {
    const erro = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })

    if (dados.data === '') erro(['data'], 'Informe a data da venda.')
    else if (dados.data > hoje()) erro(['data'], 'A data da venda não pode ser futura.')
    if (dados.cliente === '') erro(['cliente'], 'Escolha o cliente.')
    if (dados.vendedor === '') erro(['vendedor'], 'Escolha o vendedor.')
    if (dados.forma_pagamento === '') erro(['forma_pagamento'], 'Escolha a forma de pagamento.')
    if (!dados.itens.length) erro(['itens'], 'Inclua ao menos um produto.')

    const pedido = new Map<number, number>()
    dados.itens.forEach((item, indice) => {
      const quantidade = lerValor(item.quantidade, { casas: 3 })
      if (quantidade === null) erro(['itens', indice, 'quantidade'], 'Informe a quantidade.')
      else if (Number.isNaN(quantidade)) {
        erro(['itens', indice, 'quantidade'], 'Informe uma quantidade, como 1,5.')
      } else if (quantidade <= 0) {
        erro(['itens', indice, 'quantidade'], 'A quantidade tem que ser maior que zero.')
      } else pedido.set(item.produto, (pedido.get(item.produto) ?? 0) + quantidade)

      const preco = lerValor(item.preco_unitario)
      if (preco === null) erro(['itens', indice, 'preco_unitario'], 'Informe o preço.')
      else if (Number.isNaN(preco)) {
        erro(['itens', indice, 'preco_unitario'], 'Informe um valor, como 10,50.')
      }

      if (Number.isNaN(lerValor(item.desconto))) {
        erro(['itens', indice, 'desconto'], 'Informe um valor, como 1,00.')
      } else {
        const valor = centavosDoItem(item)
        if (valor && valor.total < 0) {
          erro(['itens', indice, 'desconto'], 'O desconto não pode passar do valor do item.')
        }
      }
    })

    // Estoque: o pedido de cada produto (somando os itens) até o saldo.
    dados.itens.forEach((item, indice) => {
      const quantidade = pedido.get(item.produto) ?? 0
      if (item.controla_estoque && quantidade > Number(item.disponivel)) {
        erro(['itens', indice, 'quantidade'], mensagemDeEstoque(item))
      }
    })

    const desconto = lerValor(dados.desconto)
    if (Number.isNaN(desconto)) erro(['desconto'], 'Informe um valor, como 5,00.')
    else if (totaisDaVenda(dados).total < 0) {
      erro(['desconto'], 'O desconto não pode passar do subtotal.')
    }
  })

export type FormularioDaVenda = z.input<typeof esquemaDaVenda>

/** Venda nova: hoje, ainda sem cliente, vendedor nem itens. */
export function valoresIniciais(): FormularioDaVenda {
  return {
    data: hoje(),
    cliente: '',
    vendedor: '',
    forma_pagamento: '',
    desconto: '',
    observacoes: '',
    itens: [],
  }
}

/** Item novo com 1 unidade do produto, pelo preço de venda do cadastro. */
export function novoItem(produto: ProdutoParaVenda): ItemDoFormulario {
  return {
    produto: produto.id,
    codigo: produto.codigo,
    descricao: produto.descricao,
    unidade: produto.unidade,
    controla_estoque: produto.controla_estoque,
    disponivel: produto.estoque_atual,
    quantidade: '1',
    preco_unitario: paraCampo(produto.preco_venda),
    desconto: '',
  }
}

/** Corpo da API: ids e números de verdade, vazios como `null` ou zero. */
export function paraApi(dados: FormularioDaVenda): DadosDaVenda {
  return {
    data: dados.data,
    cliente: Number(dados.cliente),
    vendedor: Number(dados.vendedor),
    forma_pagamento: dados.forma_pagamento,
    desconto: lerValor(dados.desconto) ?? 0,
    observacoes: dados.observacoes.trim() === '' ? null : dados.observacoes.trim(),
    itens: dados.itens.map((item) => ({
      produto: item.produto,
      quantidade: lerValor(item.quantidade, { casas: 3 }) ?? 0,
      preco_unitario: lerValor(item.preco_unitario) ?? 0,
      desconto: lerValor(item.desconto) ?? 0,
    })),
  }
}

/** Campos que o servidor pode recusar, para levar o erro 422 ao lugar certo. */
export function camposDoServidor(quantidadeDeItens: number): string[] {
  return [
    'data',
    'cliente',
    'vendedor',
    'forma_pagamento',
    'desconto',
    'observacoes',
    'itens',
    ...Array.from({ length: quantidadeDeItens }, (_, indice) =>
      ['produto', 'quantidade', 'preco_unitario', 'desconto'].map(
        (campo) => `itens.${indice}.${campo}`,
      ),
    ).flat(),
  ]
}
