import { describe, expect, it } from 'vitest'

import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'

describe('cpf', () => {
  it.each([
    ['529.982.247-25', true],
    ['52998224725', true],
    ['52998224726', false],
    ['111.111.111-11', false],
    ['5299822472', false],
    ['', false],
  ])('valida %s como %s', (cpf, valido) => {
    expect(cpfValido(cpf)).toBe(valido)
  })

  it.each([
    ['529', '529'],
    ['5299', '529.9'],
    ['529982', '529.982'],
    ['5299822', '529.982.2'],
    ['529982247', '529.982.247'],
    ['5299822472', '529.982.247-2'],
    ['52998224725', '529.982.247-25'],
    ['529982247250', '529.982.247-25'],
    ['529.982.247-25', '529.982.247-25'],
  ])('formata %s como %s', (digitado, formatado) => {
    expect(formatarCpf(digitado)).toBe(formatado)
  })

  it('remove a máscara', () => {
    expect(somenteDigitos('529.982.247-25')).toBe('52998224725')
  })
})
