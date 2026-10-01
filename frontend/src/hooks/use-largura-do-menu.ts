import * as React from 'react'

export const LARGURA_PADRAO = 256
export const LARGURA_MINIMA = 224
export const LARGURA_MAXIMA = 480
export const PASSO_TECLADO = 16
const CHAVE = 'erp_estudos.menu.largura'

const limitar = (largura: number) =>
  Math.round(Math.min(LARGURA_MAXIMA, Math.max(LARGURA_MINIMA, largura)))

/** Largura do menu lateral em pixels, lembrada neste navegador. */
export function useLarguraDoMenu() {
  const [largura, setLargura] = React.useState(() => {
    try {
      const salva = Number(localStorage.getItem(CHAVE))
      return salva ? limitar(salva) : LARGURA_PADRAO
    } catch {
      return LARGURA_PADRAO
    }
  })

  const alterar = React.useCallback((nova: number) => {
    const valor = limitar(nova)
    setLargura(valor)
    try {
      localStorage.setItem(CHAVE, String(valor))
    } catch {
      // Sem armazenamento (janela privada): a largura vale só nesta sessão.
    }
  }, [])

  return [largura, alterar] as const
}
