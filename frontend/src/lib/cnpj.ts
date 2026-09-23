/**
 * CNPJ numérico ou alfanumérico (IN RFB 2.229/2024, em vigor desde julho de 2026): as 12 primeiras
 * posições aceitam letras e números; os 2 dígitos verificadores são sempre números.
 */

/** Remove a máscara e passa para maiúsculas: "12.abc.345/01de-35" → "12ABC34501DE35". */
export function normalizarCnpj(valor: string): string {
  return valor.replace(/[^0-9a-z]/gi, '').toUpperCase()
}

/** Aplica a máscara 00.000.000/0000-00 conforme o usuário digita (no máximo 14 caracteres). */
export function formatarCnpj(valor: string): string {
  return normalizarCnpj(valor)
    .slice(0, 14)
    .replace(/^(\w{2})(\w)/, '$1.$2')
    .replace(/^(\w{2})\.(\w{3})(\w)/, '$1.$2.$3')
    .replace(/^(\w{2})\.(\w{3})\.(\w{3})(\w)/, '$1.$2.$3/$4')
    .replace(/\/(\w{4})(\w{1,2})$/, '/$1-$2')
}

/** Módulo 11 com pesos de 2 a 9 da direita para a esquerda; cada caractere vale seu código − 48. */
function digitoVerificador(caracteres: string): number {
  let peso = 2
  const soma = [...caracteres].reverse().reduce((total, caractere) => {
    const parcela = (caractere.charCodeAt(0) - 48) * peso
    peso = peso === 9 ? 2 : peso + 1
    return total + parcela
  }, 0)
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

/** Confere o formato e os dígitos verificadores (aceita com ou sem máscara). */
export function cnpjValido(valor: string): boolean {
  const cnpj = normalizarCnpj(valor)
  if (!/^[0-9A-Z]{12}\d{2}$/.test(cnpj) || /^(.)\1{13}$/.test(cnpj)) return false
  const primeiro = digitoVerificador(cnpj.slice(0, 12))
  const segundo = digitoVerificador(cnpj.slice(0, 12) + primeiro)
  return cnpj.slice(12) === `${primeiro}${segundo}`
}
