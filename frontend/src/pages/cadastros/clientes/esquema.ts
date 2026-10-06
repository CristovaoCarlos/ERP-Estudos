import { z } from 'zod'

import {
  CONTRIBUINTE,
  formatarCep,
  formatarDocumento,
  formatarLocalizacao,
  lerLocalizacao,
  formatarTelefone,
  type Cliente,
  type DadosDoCliente,
  type IndicadorIe,
} from '@/lib/cadastros-clientes'
import { cnpjValido, normalizarCnpj } from '@/lib/cnpj'
import { cpfValido, somenteDigitos } from '@/lib/cpf'

/** "1.500,50" ou "1500.50" → 1500.5; vazio → null; texto inválido → NaN. */
export function lerValor(texto: string): number | null {
  const limpo = texto.trim()
  if (limpo === '') return null
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  return /^\d+(\.\d{1,2})?$/.test(normalizado) ? Number(normalizado) : NaN
}

const max = (tamanho: number) => z.string().max(tamanho, `Use no máximo ${tamanho} caracteres.`)

/**
 * Formulário do cliente. Os campos seguem o corpo da API (`endereco.cep`, `fiscal.indicador_ie`),
 * então os erros 422 do servidor caem no campo certo. As regras que dependem do tipo de pessoa e
 * do indicador da IE ficam no `superRefine`, como no backend.
 */
export const esquemaDoCliente = z
  .object({
    tipo_pessoa: z.enum(['F', 'J']),
    cpf_cnpj: z.string(),
    nome: max(150).trim(),
    nome_fantasia: max(150),
    rg: max(20),
    data_nascimento: z.string(),
    endereco: z.object({
      cep: z.string(),
      logradouro: max(150),
      numero: max(10),
      complemento: max(60),
      bairro: max(60),
      uf: z.string(),
      cidade: z.string(),
      localizacao: z.string(),
    }),
    contato: z.object({
      email: z.union([z.literal(''), z.email('Informe um e-mail válido.').max(150)]),
      telefone: z.string(),
      celular: z.string(),
    }),
    fiscal: z.object({
      indicador_ie: z.enum(['1', '2', '9']),
      inscricao_estadual: max(20),
      inscricao_municipal: max(20),
      consumidor_final: z.boolean(),
    }),
    limite_credito: z.string(),
    observacoes: max(5000),
    ativo: z.boolean(),
  })
  .superRefine((dados, ctx) => {
    const erro = (path: string[], message: string) =>
      ctx.addIssue({ code: 'custom', path, message })
    const juridica = dados.tipo_pessoa === 'J'

    if (juridica ? !cnpjValido(dados.cpf_cnpj) : !cpfValido(dados.cpf_cnpj)) {
      erro(['cpf_cnpj'], juridica ? 'Informe um CNPJ válido.' : 'Informe um CPF válido.')
    }
    if (dados.nome === '') erro(['nome'], juridica ? 'Informe a razão social.' : 'Informe o nome.')
    if (!juridica && dados.data_nascimento > new Date().toISOString().slice(0, 10)) {
      erro(['data_nascimento'], 'A data de nascimento não pode ser futura.')
    }
    // Endereço e celular são obrigatórios; complemento, e-mail e telefone, não.
    const cep = somenteDigitos(dados.endereco.cep)
    if (cep === '') erro(['endereco', 'cep'], 'Informe o CEP.')
    else if (cep.length !== 8) erro(['endereco', 'cep'], 'O CEP tem 8 dígitos.')
    if (dados.endereco.logradouro.trim() === '') {
      erro(['endereco', 'logradouro'], 'Informe o logradouro.')
    }
    if (dados.endereco.numero.trim() === '')
      erro(['endereco', 'numero'], 'Informe o número (ou S/N).')
    if (dados.endereco.bairro.trim() === '') erro(['endereco', 'bairro'], 'Informe o bairro.')
    if (dados.endereco.localizacao.trim() !== '' && !lerLocalizacao(dados.endereco.localizacao)) {
      erro(
        ['endereco', 'localizacao'],
        'Use o formato do Google Maps: latitude, longitude (ex.: -22.905600, -47.060800).',
      )
    }
    if (dados.endereco.uf === '') erro(['endereco', 'uf'], 'Escolha a UF.')
    else if (dados.endereco.cidade === '') erro(['endereco', 'cidade'], 'Escolha a cidade.')
    const telefone = somenteDigitos(dados.contato.telefone)
    if (telefone !== '' && telefone.length < 10) {
      erro(['contato', 'telefone'], 'Informe o telefone com DDD.')
    }
    const celular = somenteDigitos(dados.contato.celular)
    if (celular === '') erro(['contato', 'celular'], 'Informe o celular.')
    else if (celular.length !== 11) {
      erro(['contato', 'celular'], 'Informe o celular com DDD (11 dígitos).')
    }
    if (
      Number(dados.fiscal.indicador_ie) === CONTRIBUINTE &&
      dados.fiscal.inscricao_estadual.trim() === ''
    ) {
      erro(['fiscal', 'inscricao_estadual'], 'Informe a inscrição estadual do contribuinte.')
    }
    const limite = lerValor(dados.limite_credito)
    if (limite !== null && Number.isNaN(limite)) {
      erro(['limite_credito'], 'Informe um valor, como 1.500,00.')
    }
  })

export type FormularioDoCliente = z.input<typeof esquemaDoCliente>

/** Valores do formulário: em branco no cadastro, do cliente na alteração. */
export function valoresIniciais(cliente?: Cliente): FormularioDoCliente {
  const tipo = cliente?.tipo_pessoa ?? 'F'
  return {
    tipo_pessoa: tipo,
    cpf_cnpj: cliente ? formatarDocumento(tipo, cliente.cpf_cnpj) : '',
    nome: cliente?.nome ?? '',
    nome_fantasia: cliente?.nome_fantasia ?? '',
    rg: cliente?.rg ?? '',
    data_nascimento: cliente?.data_nascimento ?? '',
    endereco: {
      cep: cliente?.endereco.cep ? formatarCep(cliente.endereco.cep) : '',
      logradouro: cliente?.endereco.logradouro ?? '',
      numero: cliente?.endereco.numero ?? '',
      complemento: cliente?.endereco.complemento ?? '',
      bairro: cliente?.endereco.bairro ?? '',
      uf: cliente?.endereco.cidade?.uf ?? '',
      cidade: cliente?.endereco.cidade ? String(cliente.endereco.cidade.id) : '',
      localizacao:
        cliente?.endereco.latitude != null && cliente.endereco.longitude != null
          ? formatarLocalizacao({
              latitude: cliente.endereco.latitude,
              longitude: cliente.endereco.longitude,
            })
          : '',
    },
    contato: {
      email: cliente?.contato.email ?? '',
      telefone: cliente?.contato.telefone ? formatarTelefone(cliente.contato.telefone) : '',
      celular: cliente?.contato.celular ? formatarTelefone(cliente.contato.celular) : '',
    },
    fiscal: {
      indicador_ie: String(cliente?.fiscal.indicador_ie ?? 9) as '1' | '2' | '9',
      inscricao_estadual: cliente?.fiscal.inscricao_estadual ?? '',
      inscricao_municipal: cliente?.fiscal.inscricao_municipal ?? '',
      consumidor_final: cliente?.fiscal.consumidor_final ?? true,
    },
    limite_credito: cliente?.limite_credito ? cliente.limite_credito.replace('.', ',') : '',
    observacoes: cliente?.observacoes ?? '',
    ativo: cliente?.ativo ?? true,
  }
}

const ouNulo = (texto: string) => (texto.trim() === '' ? null : texto.trim())

/** Corpo da API: documentos e telefones sem máscara, vazios como `null`. */
export function paraApi(dados: FormularioDoCliente): DadosDoCliente {
  const juridica = dados.tipo_pessoa === 'J'
  const indicador = Number(dados.fiscal.indicador_ie) as IndicadorIe
  return {
    tipo_pessoa: dados.tipo_pessoa,
    cpf_cnpj: juridica ? normalizarCnpj(dados.cpf_cnpj) : somenteDigitos(dados.cpf_cnpj),
    nome: dados.nome.trim(),
    nome_fantasia: juridica ? ouNulo(dados.nome_fantasia) : null,
    rg: juridica ? null : ouNulo(dados.rg),
    data_nascimento: juridica ? null : ouNulo(dados.data_nascimento),
    endereco: {
      cep: ouNulo(somenteDigitos(dados.endereco.cep)),
      logradouro: ouNulo(dados.endereco.logradouro),
      numero: ouNulo(dados.endereco.numero),
      complemento: ouNulo(dados.endereco.complemento),
      bairro: ouNulo(dados.endereco.bairro),
      cidade: dados.endereco.cidade ? Number(dados.endereco.cidade) : null,
      latitude: lerLocalizacao(dados.endereco.localizacao)?.latitude ?? null,
      longitude: lerLocalizacao(dados.endereco.localizacao)?.longitude ?? null,
    },
    contato: {
      email: ouNulo(dados.contato.email),
      telefone: ouNulo(somenteDigitos(dados.contato.telefone)),
      celular: ouNulo(somenteDigitos(dados.contato.celular)),
    },
    fiscal: {
      indicador_ie: indicador,
      inscricao_estadual:
        indicador === CONTRIBUINTE ? ouNulo(dados.fiscal.inscricao_estadual) : null,
      inscricao_municipal: ouNulo(dados.fiscal.inscricao_municipal),
      consumidor_final: dados.fiscal.consumidor_final,
    },
    limite_credito: lerValor(dados.limite_credito),
    observacoes: ouNulo(dados.observacoes),
    ativo: dados.ativo,
  }
}

/** Campos que o servidor pode recusar, para levar o erro 422 ao lugar certo. */
export const CAMPOS = [
  'tipo_pessoa',
  'cpf_cnpj',
  'nome',
  'nome_fantasia',
  'rg',
  'data_nascimento',
  'endereco.cep',
  'endereco.logradouro',
  'endereco.numero',
  'endereco.complemento',
  'endereco.bairro',
  'endereco.cidade',
  'endereco.localizacao',
  'contato.email',
  'contato.telefone',
  'contato.celular',
  'fiscal.indicador_ie',
  'fiscal.inscricao_estadual',
  'fiscal.inscricao_municipal',
  'limite_credito',
  'observacoes',
] as const

export type Aba = 'identificacao' | 'endereco' | 'fiscal' | 'observacoes'

/** Aba em que fica cada campo, para marcar a aba com erro e abrir a primeira delas. */
export function abaDoCampo(campo: string): Aba {
  if (campo.startsWith('endereco.') || campo.startsWith('contato.')) return 'endereco'
  if (campo.startsWith('fiscal.') || campo === 'limite_credito') return 'fiscal'
  if (campo === 'observacoes') return 'observacoes'
  return 'identificacao'
}
