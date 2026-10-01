import { z } from 'zod'

export const descricao = z
  .string()
  .trim()
  .min(1, 'Informe a descrição.')
  .max(50, 'Use no máximo 50 caracteres.')
