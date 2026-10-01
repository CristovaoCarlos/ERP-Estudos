import { ref } from 'vue'

export const LARGURA_PADRAO = 256
export const LARGURA_MINIMA = 224
export const LARGURA_MAXIMA = 480
export const PASSO_TECLADO = 16
const CHAVE = 'erp_estudos.menu.largura'

const limitar = (largura: number) =>
  Math.round(Math.min(LARGURA_MAXIMA, Math.max(LARGURA_MINIMA, largura)))

function larguraSalva(): number {
  try {
    const salva = Number(localStorage.getItem(CHAVE))
    return salva ? limitar(salva) : LARGURA_PADRAO
  } catch {
    return LARGURA_PADRAO
  }
}

/** Largura do menu lateral em pixels, lembrada neste navegador. */
export function useLarguraDoMenu() {
  const largura = ref(larguraSalva())

  const alterar = (nova: number) => {
    const valor = limitar(nova)
    largura.value = valor
    try {
      localStorage.setItem(CHAVE, String(valor))
    } catch {
      // Sem armazenamento (janela privada): a largura vale só nesta sessão.
    }
  }

  return { largura, alterar }
}
