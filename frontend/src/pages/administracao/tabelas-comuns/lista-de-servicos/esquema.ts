import { z } from 'zod'

export const descricao = z
  .string()
  .trim()
  .min(1, 'Informe a descrição.')
  .max(1000, 'Use no máximo 1.000 caracteres.')
