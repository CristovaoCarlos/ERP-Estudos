<script setup lang="ts">
import { useResizeObserver } from '@vueuse/core'
import { computed, ref, watch } from 'vue'

import { DialogContent } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

/**
 * Conteúdo de diálogo de formulário (no lugar do `DialogContent`). O usuário ajusta o tamanho pelo
 * canto inferior direito, e o tamanho escolhido fica lembrado neste navegador, por formulário
 * (`chave`): na próxima abertura, o diálogo volta como foi deixado.
 */
const props = withDefaults(
  defineProps<{
    /** Identifica o formulário no `localStorage` (ex.: `cliente`). */
    chave: string
    /** Largura inicial, antes de o usuário ajustar. */
    largura?: string
  }>(),
  { largura: 'sm:w-lg' },
)

type Tamanho = { largura: number; altura: number }
const ARMAZENAMENTO = `erp_estudos.dialogo.${props.chave}`

function lerTamanho(): Tamanho | null {
  try {
    const salvo = JSON.parse(localStorage.getItem(ARMAZENAMENTO) ?? 'null')
    return typeof salvo?.largura === 'number' && typeof salvo?.altura === 'number' ? salvo : null
  } catch {
    return null
  }
}

function gravarTamanho(tamanho: Tamanho) {
  try {
    localStorage.setItem(ARMAZENAMENTO, JSON.stringify(tamanho))
  } catch {
    // Sem localStorage, o tamanho vale só enquanto o diálogo está aberto.
  }
}

// O `DialogContent` fica num portal: a âncora, primeiro filho do conteúdo, dá acesso ao elemento.
const ancora = ref<HTMLElement>()
const conteudo = computed(() => ancora.value?.parentElement ?? undefined)

// Volta ao tamanho deixado da última vez a cada vez que o conteúdo aparece. O diálogo pode ficar
// montado entre aberturas (ex.: Nova empresa, com `DialogTrigger`): cada abertura cria um elemento
// novo, e é por elemento que se restaura.
let restaurado: HTMLElement | undefined
watch(
  conteudo,
  (elemento) => {
    if (!elemento || elemento === restaurado) return
    restaurado = elemento
    const salvo = lerTamanho()
    if (!salvo) return
    elemento.style.width = `${salvo.largura}px`
    elemento.style.height = `${salvo.altura}px`
  },
  { immediate: true },
)

// O redimensionamento pelo canto grava largura e altura no `style` do elemento. Sem isso, a
// mudança veio do conteúdo (troca de aba, mensagem de erro) e não é uma escolha do usuário.
useResizeObserver(conteudo, () => {
  const elemento = conteudo.value
  if (!elemento?.style.width || !elemento.style.height) return
  gravarTamanho({ largura: elemento.offsetWidth, altura: elemento.offsetHeight })
})
</script>

<template>
  <DialogContent
    :class="
      cn(
        'max-h-[95svh] min-h-48 resize content-start overflow-auto sm:max-w-[calc(100vw-2rem)] sm:min-w-80',
        largura,
      )
    "
  >
    <span ref="ancora" hidden />
    <slot />
  </DialogContent>
</template>
