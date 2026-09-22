/** Remove a máscara: "123.456.789-09" → "12345678909". */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** Aplica a máscara 000.000.000-00 conforme o usuário digita (no máximo 11 dígitos). */
export function formatarCpf(valor: string): string {
  return somenteDigitos(valor)
    .slice(0, 11)
    .replace(/^(\d{3})(\d)/, '$1.$2')
    .replace(/^(\d{3})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d{1,2})$/, '.$1-$2')
}

function digitoVerificador(digitos: string): number {
  const soma = [...digitos].reduce(
    (total, digito, i) => total + Number(digito) * (digitos.length + 1 - i),
    0,
  )
  const resto = soma % 11
  return resto < 2 ? 0 : 11 - resto
}

/** Confere o tamanho e os dígitos verificadores (aceita com ou sem máscara). */
export function cpfValido(valor: string): boolean {
  const cpf = somenteDigitos(valor)
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
  return (
    Number(cpf[9]) === digitoVerificador(cpf.slice(0, 9)) &&
    Number(cpf[10]) === digitoVerificador(cpf.slice(0, 10))
  )
}
