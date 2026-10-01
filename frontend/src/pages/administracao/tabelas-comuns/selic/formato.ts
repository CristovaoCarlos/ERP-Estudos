import type { Selic } from '@/lib/administracao-tabelas-comuns-selic'

const nomeDoMes = new Intl.DateTimeFormat('pt-BR', { month: 'long' })

export const percentual = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

/** 1 → "Janeiro". */
export function mesPorExtenso(mes: number): string {
  const nome = nomeDoMes.format(new Date(2000, mes - 1, 1))
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

/** "01/2026". */
export function competencia(selic: Selic): string {
  return `${String(selic.mes).padStart(2, '0')}/${selic.ano}`
}
