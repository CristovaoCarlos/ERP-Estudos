/**
 * Lê um número digitado no formato brasileiro ("1.500,50") ou com ponto decimal ("1500.50").
 * Vazio → `null`; fora do formato, com mais casas que `casas` ou negativo sem `negativo` → `NaN`.
 */
export function lerValor(
  texto: string,
  { casas = 2, negativo = false }: { casas?: number; negativo?: boolean } = {},
): number | null {
  const limpo = texto.trim()
  if (limpo === '') return null
  const normalizado = limpo.includes(',') ? limpo.replace(/\./g, '').replace(',', '.') : limpo
  const formato = new RegExp(`^${negativo ? '-?' : ''}\\d+(\\.\\d{1,${casas}})?$`)
  return formato.test(normalizado) ? Number(normalizado) : NaN
}

/** Número da API ("1500.5000") para o campo do formulário ("1500,5"), sem zeros sobrando. */
export function paraCampo(valor: string | number | null | undefined): string {
  return valor === null || valor === undefined ? '' : String(Number(valor)).replace('.', ',')
}

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

/** 1500.5 → "R$ 1.500,50". */
export function formatarMoeda(valor: string | number): string {
  return moeda.format(Number(valor))
}

/** 12.5 → "12,5"; 3 → "3" (até 3 casas, para quantidades). */
export function formatarQuantidade(valor: string | number): string {
  return new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 3 }).format(Number(valor))
}
