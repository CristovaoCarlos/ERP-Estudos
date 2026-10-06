import { z } from 'zod'

import {
  formatarCest,
  formatarNcm,
  gtinValido,
  type DadosDoProduto,
  type Produto,
} from '@/lib/cadastros-produtos'
import { somenteDigitos } from '@/lib/cpf'
import { lerValor, paraCampo } from '@/lib/numeros'

const max = (tamanho: number, mensagem = `Use no máximo ${tamanho} caracteres.`) =>
  z.string().max(tamanho, mensagem)

/**
 * Formulário do produto. Os campos seguem o corpo da API (`precos.venda`, `fiscal.ncm`), então os
 * erros 422 do servidor caem no campo certo. Valores numéricos são texto com vírgula decimal.
 */
export const esquemaDoProduto = z
  .object({
    codigo: max(30),
    descricao: max(120, 'Use no máximo 120 caracteres (limite da NF-e).'),
    codigo_barras: z.string(),
    unidade: z.string(),
    categoria: max(60),
    precos: z.object({ custo: z.string(), venda: z.string() }),
    estoque: z.object({ controla: z.boolean(), atual: z.string(), minimo: z.string() }),
    fiscal: z.object({ ncm: z.string(), cest: z.string(), origem: z.string() }),
    pesos: z.object({ bruto: z.string(), liquido: z.string() }),
    observacoes: max(5000),
    ativo: z.boolean(),
  })
  .superRefine((dados, ctx) => {
    const erro = (path: string[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })
    const numero = (path: string[], texto: string, opcoes?: Parameters<typeof lerValor>[1]) => {
      const valor = lerValor(texto, opcoes)
      if (Number.isNaN(valor)) erro(path, 'Informe um número, como 1.500,50.')
      return valor
    }

    const codigo = dados.codigo.trim()
    if (codigo === '') erro(['codigo'], 'Informe o código.')
    else if (!/^[A-Za-z0-9./-]+$/.test(codigo)) {
      erro(['codigo'], 'Use só letras, números, ponto, barra e hífen.')
    }
    if (dados.descricao.trim() === '') erro(['descricao'], 'Informe a descrição.')
    if (dados.codigo_barras.trim() !== '' && !gtinValido(dados.codigo_barras)) {
      erro(
        ['codigo_barras'],
        'Código de barras inválido: confira os dígitos (EAN de 8, 12, 13 ou 14 números).',
      )
    }
    if (dados.unidade === '') erro(['unidade'], 'Escolha a unidade.')

    numero(['precos', 'custo'], dados.precos.custo, { casas: 4 })
    const venda = numero(['precos', 'venda'], dados.precos.venda)
    if (venda === null) erro(['precos', 'venda'], 'Informe o preço de venda.')

    if (dados.estoque.controla) {
      numero(['estoque', 'minimo'], dados.estoque.minimo, { casas: 3 })
    }

    const ncm = somenteDigitos(dados.fiscal.ncm)
    if (ncm !== '' && ncm.length !== 8) erro(['fiscal', 'ncm'], 'O NCM tem 8 dígitos.')
    const cest = somenteDigitos(dados.fiscal.cest)
    if (cest !== '' && cest.length !== 7) erro(['fiscal', 'cest'], 'O CEST tem 7 dígitos.')

    const bruto = numero(['pesos', 'bruto'], dados.pesos.bruto, { casas: 3 })
    const liquido = numero(['pesos', 'liquido'], dados.pesos.liquido, { casas: 3 })
    if (bruto !== null && liquido !== null && liquido > bruto) {
      erro(['pesos', 'liquido'], 'O peso líquido não pode passar do bruto.')
    }
  })

export type FormularioDoProduto = z.input<typeof esquemaDoProduto>

/** Valores do formulário: em branco no cadastro, do produto na alteração. */
export function valoresIniciais(produto?: Produto): FormularioDoProduto {
  return {
    codigo: produto?.codigo ?? '',
    descricao: produto?.descricao ?? '',
    codigo_barras: produto?.codigo_barras ?? '',
    unidade: produto?.unidade ?? 'UN',
    categoria: produto?.categoria ?? '',
    precos: { custo: paraCampo(produto?.precos.custo), venda: paraCampo(produto?.precos.venda) },
    estoque: {
      controla: produto?.estoque.controla ?? true,
      atual: produto ? paraCampo(produto.estoque.atual) : '0',
      minimo: paraCampo(produto?.estoque.minimo),
    },
    fiscal: {
      ncm: produto?.fiscal.ncm ? formatarNcm(produto.fiscal.ncm) : '',
      cest: produto?.fiscal.cest ? formatarCest(produto.fiscal.cest) : '',
      origem: String(produto?.fiscal.origem ?? 0),
    },
    pesos: { bruto: paraCampo(produto?.pesos.bruto), liquido: paraCampo(produto?.pesos.liquido) },
    observacoes: produto?.observacoes ?? '',
    ativo: produto?.ativo ?? true,
  }
}

const ouNulo = (texto: string) => (texto.trim() === '' ? null : texto.trim())

/** Corpo da API: números de verdade, máscaras retiradas, vazios como `null`. */
export function paraApi(dados: FormularioDoProduto): DadosDoProduto {
  const controla = dados.estoque.controla
  return {
    codigo: dados.codigo.trim().toUpperCase(),
    descricao: dados.descricao.trim(),
    codigo_barras: ouNulo(dados.codigo_barras.replace(/[\s.-]/g, '')),
    unidade: dados.unidade,
    categoria: ouNulo(dados.categoria),
    precos: {
      custo: lerValor(dados.precos.custo, { casas: 4 }),
      venda: lerValor(dados.precos.venda) ?? 0,
    },
    estoque: {
      controla,
      minimo: controla ? lerValor(dados.estoque.minimo, { casas: 3 }) : null,
    },
    fiscal: {
      ncm: ouNulo(somenteDigitos(dados.fiscal.ncm)),
      cest: ouNulo(somenteDigitos(dados.fiscal.cest)),
      origem: Number(dados.fiscal.origem),
    },
    pesos: {
      bruto: lerValor(dados.pesos.bruto, { casas: 3 }),
      liquido: lerValor(dados.pesos.liquido, { casas: 3 }),
    },
    observacoes: ouNulo(dados.observacoes),
    ativo: dados.ativo,
  }
}

/** Campos que o servidor pode recusar, para levar o erro 422 ao lugar certo. */
export const CAMPOS = [
  'codigo',
  'descricao',
  'codigo_barras',
  'unidade',
  'categoria',
  'precos.custo',
  'precos.venda',
  'estoque.minimo',
  'fiscal.ncm',
  'fiscal.cest',
  'fiscal.origem',
  'pesos.bruto',
  'pesos.liquido',
  'observacoes',
] as const

export type Aba = 'identificacao' | 'precos' | 'fiscal' | 'observacoes'

/** Aba em que fica cada campo, para marcar a aba com erro e abrir a primeira delas. */
export function abaDoCampo(campo: string): Aba {
  if (campo.startsWith('precos.') || campo.startsWith('estoque.')) return 'precos'
  if (campo.startsWith('fiscal.') || campo.startsWith('pesos.')) return 'fiscal'
  if (campo === 'observacoes') return 'observacoes'
  return 'identificacao'
}
