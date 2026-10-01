import { z } from 'zod'

export const esquemaDaCidade = z.object({
  codigo_ibge: z
    .string()
    .trim()
    .regex(/^\d{7}$/, 'O código do IBGE tem 7 dígitos.'),
  nome: z.string().trim().min(1, 'Informe o nome.').max(100, 'Use no máximo 100 caracteres.'),
  uf: z.string().min(1, 'Escolha a UF.'),
})

export const esquemaDaAlteracao = esquemaDaCidade.omit({ codigo_ibge: true })
