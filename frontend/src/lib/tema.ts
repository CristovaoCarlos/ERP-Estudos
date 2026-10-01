import { useColorMode } from '@vueuse/core'

/**
 * Tema claro ou escuro, pela classe `dark` no `<html>`. Começa no claro e lembra a escolha neste
 * navegador (mesma chave `theme` usada antes pelo next-themes).
 */
export function useTema() {
  return useColorMode({ storageKey: 'theme', initialValue: 'light' })
}

/** Aplica o tema salvo antes de montar o app, para a página não piscar no claro. */
export function iniciarTema() {
  useTema()
}
