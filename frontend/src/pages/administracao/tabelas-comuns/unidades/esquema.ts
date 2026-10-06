import { z } from 'zod'

const descricao = z
  .string()
  .trim()
  .min(1, 'Informe a descrição.')
  .max(60, 'Use no máximo 60 caracteres.')

export const esquemaDaUnidade = z.object({
  sigla: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9]{1,6}$/, 'Use de 1 a 6 letras ou números, sem espaço (ex.: UN, KG, M2).'),
  descricao,
})

export const esquemaDaAlteracao = z.object({ descricao })
