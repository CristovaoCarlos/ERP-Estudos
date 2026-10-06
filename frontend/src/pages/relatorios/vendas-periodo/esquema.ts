import { z } from 'zod'

import type { FiltrosDoRelatorio } from '@/lib/relatorios-vendas'
import { hoje } from '@/pages/lancamentos/vendas/esquema'

/** Período mais longo aceito, em dias (o mesmo do servidor). */
export const DIAS_NO_PERIODO = 366

/** Dias entre duas datas `AAAA-MM-DD`. */
function diasEntre(inicio: string, fim: string): number {
  return Math.round(
    (Date.parse(`${fim}T00:00:00Z`) - Date.parse(`${inicio}T00:00:00Z`)) / 86_400_000,
  )
}

/** Filtros do relatório. Vendedor, cliente e pagamento vazios: todos. */
export const esquemaDosFiltros = z
  .object({
    inicio: z.string(),
    fim: z.string(),
    vendedor: z.string(),
    cliente: z.string(),
    forma_pagamento: z.string(),
    incluir_canceladas: z.boolean(),
  })
  .superRefine((dados, ctx) => {
    const erro = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })

    if (dados.inicio === '') erro('inicio', 'Informe a data inicial.')
    if (dados.fim === '') erro('fim', 'Informe a data final.')
    if (dados.inicio === '' || dados.fim === '') return
    if (dados.fim < dados.inicio) erro('fim', 'A data final não pode ser antes da inicial.')
    else if (diasEntre(dados.inicio, dados.fim) >= DIAS_NO_PERIODO) {
      erro('fim', `O período vai até ${DIAS_NO_PERIODO} dias.`)
    }
  })

export type FormularioDosFiltros = z.input<typeof esquemaDosFiltros>

/** Do primeiro dia do mês até hoje, todas as vendas finalizadas. */
export function valoresIniciais(): FormularioDosFiltros {
  const dia = hoje()
  return {
    inicio: `${dia.slice(0, 8)}01`,
    fim: dia,
    vendedor: '',
    cliente: '',
    forma_pagamento: '',
    incluir_canceladas: false,
  }
}

/** Filtros da URL: só os preenchidos. */
export function paraFiltros(dados: FormularioDosFiltros): FiltrosDoRelatorio {
  return {
    inicio: dados.inicio,
    fim: dados.fim,
    ...(dados.vendedor && { vendedor: Number(dados.vendedor) }),
    ...(dados.cliente && { cliente: Number(dados.cliente) }),
    ...(dados.forma_pagamento && { forma_pagamento: dados.forma_pagamento }),
    incluir_canceladas: dados.incluir_canceladas ? 1 : 0,
  }
}

export const CAMPOS = ['inicio', 'fim', 'vendedor', 'cliente', 'forma_pagamento'] as const
