import { z } from 'zod'

import { formatarTelefone } from '@/lib/cadastros-clientes'
import type { DadosDoVendedor, Vendedor } from '@/lib/cadastros-vendedores'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'
import { lerValor, paraCampo } from '@/lib/numeros'

const max = (tamanho: number) => z.string().max(tamanho, `Use no máximo ${tamanho} caracteres.`)

/**
 * Formulário do vendedor. Os campos seguem o corpo da API (`contato.celular`, `comercial.comissao`),
 * então os erros 422 do servidor caem no campo certo.
 */
export const esquemaDoVendedor = z
  .object({
    nome: max(150),
    cpf: z.string(),
    data_admissao: z.string(),
    contato: z.object({
      email: z.union([z.literal(''), z.email('Informe um e-mail válido.').max(150)]),
      celular: z.string(),
      telefone: z.string(),
    }),
    comercial: z.object({ comissao: z.string(), meta_mensal: z.string(), regiao: max(60) }),
    observacoes: max(5000),
    ativo: z.boolean(),
  })
  .superRefine((dados, ctx) => {
    const erro = (path: string[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })

    if (dados.nome.trim() === '') erro(['nome'], 'Informe o nome.')
    if (!cpfValido(dados.cpf)) erro(['cpf'], 'Informe um CPF válido.')
    if (dados.data_admissao > new Date().toISOString().slice(0, 10)) {
      erro(['data_admissao'], 'A data de admissão não pode ser futura.')
    }

    const celular = somenteDigitos(dados.contato.celular)
    if (celular === '') erro(['contato', 'celular'], 'Informe o celular.')
    else if (celular.length !== 11) {
      erro(['contato', 'celular'], 'Informe o celular com DDD (11 dígitos).')
    }
    const telefone = somenteDigitos(dados.contato.telefone)
    if (telefone !== '' && telefone.length < 10) {
      erro(['contato', 'telefone'], 'Informe o telefone com DDD.')
    }

    const comissao = lerValor(dados.comercial.comissao)
    if (comissao === null) erro(['comercial', 'comissao'], 'Informe a comissão (0 se não houver).')
    else if (Number.isNaN(comissao))
      erro(['comercial', 'comissao'], 'Informe um percentual, como 3,5.')
    else if (comissao > 100) erro(['comercial', 'comissao'], 'A comissão vai de 0 a 100%.')
    if (Number.isNaN(lerValor(dados.comercial.meta_mensal))) {
      erro(['comercial', 'meta_mensal'], 'Informe um valor, como 50.000,00.')
    }
  })

export type FormularioDoVendedor = z.input<typeof esquemaDoVendedor>

/** Valores do formulário: em branco no cadastro, do vendedor na alteração. */
export function valoresIniciais(vendedor?: Vendedor): FormularioDoVendedor {
  return {
    nome: vendedor?.nome ?? '',
    cpf: vendedor ? formatarCpf(vendedor.cpf) : '',
    data_admissao: vendedor?.data_admissao ?? '',
    contato: {
      email: vendedor?.contato.email ?? '',
      celular: vendedor ? formatarTelefone(vendedor.contato.celular) : '',
      telefone: vendedor?.contato.telefone ? formatarTelefone(vendedor.contato.telefone) : '',
    },
    comercial: {
      comissao: vendedor ? paraCampo(vendedor.comercial.comissao) : '',
      meta_mensal: paraCampo(vendedor?.comercial.meta_mensal),
      regiao: vendedor?.comercial.regiao ?? '',
    },
    observacoes: vendedor?.observacoes ?? '',
    ativo: vendedor?.ativo ?? true,
  }
}

const ouNulo = (texto: string) => (texto.trim() === '' ? null : texto.trim())

/** Corpo da API: CPF e telefones sem máscara, números de verdade, vazios como `null`. */
export function paraApi(dados: FormularioDoVendedor): DadosDoVendedor {
  return {
    nome: dados.nome.trim(),
    cpf: somenteDigitos(dados.cpf),
    data_admissao: ouNulo(dados.data_admissao),
    contato: {
      email: ouNulo(dados.contato.email),
      celular: somenteDigitos(dados.contato.celular),
      telefone: ouNulo(somenteDigitos(dados.contato.telefone)),
    },
    comercial: {
      comissao: lerValor(dados.comercial.comissao) ?? 0,
      meta_mensal: lerValor(dados.comercial.meta_mensal),
      regiao: ouNulo(dados.comercial.regiao),
    },
    observacoes: ouNulo(dados.observacoes),
    ativo: dados.ativo,
  }
}

/** Campos que o servidor pode recusar, para levar o erro 422 ao lugar certo. */
export const CAMPOS = [
  'nome',
  'cpf',
  'data_admissao',
  'contato.email',
  'contato.celular',
  'contato.telefone',
  'comercial.comissao',
  'comercial.meta_mensal',
  'comercial.regiao',
  'observacoes',
] as const
