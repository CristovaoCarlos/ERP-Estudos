import { useMutation, useQuery, useQueryClient } from '@tanstack/vue-query'
import { computed, toValue, type MaybeRefOrGetter } from 'vue'

import { api } from '@/lib/api'
import { formatarCnpj } from '@/lib/cnpj'
import { formatarCpf, somenteDigitos } from '@/lib/cpf'

export type TipoPessoa = 'F' | 'J'

/** Indicador da IE do destinatário na NF-e. */
export type IndicadorIe = 1 | 2 | 9

export const INDICADORES_IE: { valor: IndicadorIe; rotulo: string }[] = [
  { valor: 1, rotulo: 'Contribuinte do ICMS' },
  { valor: 2, rotulo: 'Contribuinte isento' },
  { valor: 9, rotulo: 'Não contribuinte' },
]

export const CONTRIBUINTE: IndicadorIe = 1

/** Cliente da prefeitura (Cadastros › Clientes). */
export type Cliente = {
  id: number
  tipo_pessoa: TipoPessoa
  /** CPF só com dígitos ou CNPJ normalizado (pode ter letras). */
  cpf_cnpj: string
  /** Nome (PF) ou razão social (PJ). */
  nome: string
  nome_fantasia: string | null
  rg: string | null
  /** `AAAA-MM-DD`. */
  data_nascimento: string | null
  endereco: {
    cep: string | null
    logradouro: string | null
    numero: string | null
    complemento: string | null
    bairro: string | null
    /** Localização no padrão do Google Maps: graus decimais. */
    latitude: number | null
    longitude: number | null
    cidade: { id: number; nome: string; uf: string } | null
  }
  contato: { email: string | null; telefone: string | null; celular: string | null }
  fiscal: {
    indicador_ie: IndicadorIe
    inscricao_estadual: string | null
    inscricao_municipal: string | null
    consumidor_final: boolean
  }
  /** Decimal em texto (`"1500.50"`); `null` é sem limite. */
  limite_credito: string | null
  observacoes: string | null
  ativo: boolean
}

/** Corpo do cadastro e da alteração: como o `Cliente`, mas a cidade vai só pelo id. */
export type DadosDoCliente = Omit<Cliente, 'id' | 'endereco' | 'limite_credito'> & {
  endereco: Omit<Cliente['endereco'], 'cidade'> & { cidade: number | null }
  limite_credito: number | null
}

export type CidadeDaUf = { id: number; codigo_ibge: string; nome: string }

/** Endereço de um CEP, como o ViaCEP devolve (campos vazios quando o CEP é geral da cidade). */
export type EnderecoDoCep = {
  logradouro: string
  complemento: string
  bairro: string
  uf: string
  /** Código do município no IBGE: acha a cidade na lista da UF. */
  codigo_ibge: string
}

/**
 * Consulta o CEP (8 dígitos) no ViaCEP (https://viacep.com.br). `null`: CEP inexistente; falha de
 * rede lança erro. Vai direto ao serviço com `fetch`, não pelo `api`: o token do ERP não sai do
 * sistema.
 */
export async function buscarCep(cep: string): Promise<EnderecoDoCep | null> {
  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
  if (resposta.status === 400) return null
  if (!resposta.ok) throw new Error(`ViaCEP respondeu ${resposta.status}.`)
  const dados = await resposta.json()
  if (dados.erro) return null
  return {
    logradouro: dados.logradouro ?? '',
    complemento: dados.complemento ?? '',
    bairro: dados.bairro ?? '',
    uf: dados.uf ?? '',
    codigo_ibge: dados.ibge ?? '',
  }
}

const CHAVE = ['cadastros', 'clientes']

export function useClientes() {
  return useQuery({
    queryKey: CHAVE,
    queryFn: async () => (await api.get<{ data: Cliente[] }>('/cadastros/clientes')).data.data,
  })
}

/** Cidades da UF escolhida no endereço (as cidades quase não mudam). */
export function useCidadesDaUf(uf: MaybeRefOrGetter<string>) {
  return useQuery({
    queryKey: computed(() => [...CHAVE, 'cidades', toValue(uf)]),
    queryFn: async () =>
      (
        await api.get<{ data: CidadeDaUf[] }>('/cadastros/clientes/cidades', {
          params: { uf: toValue(uf) },
        })
      ).data.data,
    enabled: computed(() => toValue(uf) !== ''),
    staleTime: Infinity,
  })
}

export function useCadastrarCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cliente: DadosDoCliente) =>
      (await api.post<Cliente>('/cadastros/clientes', cliente)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}

export function useAlterarCliente(id: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (cliente: DadosDoCliente) =>
      (await api.put<Cliente>(`/cadastros/clientes/${id}`, cliente)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}

export function useRemoverCliente() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/cadastros/clientes/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: CHAVE }),
  })
}

/** CPF ou CNPJ com a máscara do tipo de pessoa. */
export function formatarDocumento(tipo: TipoPessoa, documento: string): string {
  return tipo === 'J' ? formatarCnpj(documento) : formatarCpf(documento)
}

/** Latitude e longitude no padrão do Google Maps. */
export type Coordenadas = { latitude: number; longitude: number }

/**
 * Lê a localização como o Google Maps copia ("-22.905600, -47.060800"): latitude e longitude em
 * graus decimais, separadas por vírgula. `null` se o texto não estiver nesse formato ou fora da faixa.
 */
export function lerLocalizacao(texto: string): Coordenadas | null {
  const partes = /^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/.exec(texto)
  if (!partes) return null
  const latitude = Number(partes[1])
  const longitude = Number(partes[2])
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null
  return { latitude, longitude }
}

/** "-22.9056, -47.0608", como o Google Maps mostra. */
export function formatarLocalizacao({ latitude, longitude }: Coordenadas): string {
  return `${latitude}, ${longitude}`
}

/** Endereço do ponto no Google Maps. */
export function linkDoGoogleMaps({ latitude, longitude }: Coordenadas): string {
  return `https://www.google.com/maps?q=${latitude},${longitude}`
}

/** "01310100" → "01310-100", conforme o usuário digita. */
export function formatarCep(valor: string): string {
  return somenteDigitos(valor)
    .slice(0, 8)
    .replace(/^(\d{5})(\d)/, '$1-$2')
}

/** Fixo "(11) 3333-4444" ou celular "(11) 98888-7777", conforme o usuário digita. */
export function formatarTelefone(valor: string): string {
  const digitos = somenteDigitos(valor).slice(0, 11)
  if (digitos.length <= 2) return digitos.replace(/^(\d+)/, '($1')
  const corpo = digitos.slice(2)
  const meio = corpo.length > 8 ? 5 : 4
  return `(${digitos.slice(0, 2)}) ${corpo.slice(0, meio)}${corpo.length > meio ? `-${corpo.slice(meio)}` : ''}`
}
