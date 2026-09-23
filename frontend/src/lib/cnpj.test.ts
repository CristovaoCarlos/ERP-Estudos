import { describe, expect, it } from 'vitest'

import { cnpjValido, formatarCnpj, normalizarCnpj } from '@/lib/cnpj'

describe('cnpj', () => {
  it.each([
    ['11.222.333/0001-81', true],
    ['11222333000181', true],
    ['12.ABC.345/01DE-35', true],
    ['12abc34501de35', true],
    ['11222333000182', false],
    ['12ABC34501DE3A', false],
    ['00000000000000', false],
    ['1122233300018', false],
    ['', false],
  ])('valida %s como %s', (cnpj, valido) => {
    expect(cnpjValido(cnpj)).toBe(valido)
  })

  it.each([
    ['11', '11'],
    ['112', '11.2'],
    ['11222', '11.222'],
    ['112223', '11.222.3'],
    ['11222333', '11.222.333'],
    ['112223330', '11.222.333/0'],
    ['112223330001', '11.222.333/0001'],
    ['1122233300018', '11.222.333/0001-8'],
    ['11222333000181', '11.222.333/0001-81'],
    ['112223330001819', '11.222.333/0001-81'],
    ['12abc34501de35', '12.ABC.345/01DE-35'],
  ])('formata %s como %s', (digitado, formatado) => {
    expect(formatarCnpj(digitado)).toBe(formatado)
  })

  it('remove a máscara e passa para maiúsculas', () => {
    expect(normalizarCnpj('12.abc.345/01de-35')).toBe('12ABC34501DE35')
  })
})
