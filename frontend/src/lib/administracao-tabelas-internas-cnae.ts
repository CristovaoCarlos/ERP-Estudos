import { useQuery } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Níveis da CNAE, do mais geral ao mais específico. */
export const niveis = [
  { valor: 'secao', rotulo: 'Seção' },
  { valor: 'divisao', rotulo: 'Divisão' },
  { valor: 'grupo', rotulo: 'Grupo' },
  { valor: 'classe', rotulo: 'Classe' },
  { valor: 'subclasse', rotulo: 'Subclasse' },
] as const

export type Nivel = (typeof niveis)[number]['valor']

/** Atividade da CNAE (banco central, igual para todas as prefeituras). */
export type Cnae = {
  id: number
  nivel: Nivel
  /** Código do nível da linha (ex.: `8593-7/00` numa subclasse, `P` numa seção). */
  codigo: string
  secao: string
  divisao: string | null
  grupo: string | null
  classe: string | null
  subclasse: string | null
  denominacao: string
  versao: string | null
  ativo: boolean
}

export function useCnae() {
  return useQuery({
    queryKey: ['administracao', 'tabelas-internas', 'cnae'],
    queryFn: async () =>
      (await api.get<{ data: Cnae[] }>('/administracao/tabelas-internas/cnae')).data.data,
    // Tabela de apoio que quase não muda: não precisa buscar de novo a cada visita.
    staleTime: Infinity,
  })
}
