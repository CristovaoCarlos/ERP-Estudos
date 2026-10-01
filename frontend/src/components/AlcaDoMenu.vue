<script setup lang="ts">
import { computed } from 'vue'

import { useSidebar } from '@/components/ui/sidebar'
import { LARGURA_MAXIMA, LARGURA_MINIMA, PASSO_TECLADO } from '@/composables/use-largura-do-menu'
import { cn } from '@/lib/utils'

/**
 * Borda direita do menu: arrastar ajusta a largura e clique recolhe/expande.
 * Pelo teclado, as setas ajustam a largura.
 */
const props = defineProps<{ largura: number }>()
const emit = defineEmits<{ alterar: [largura: number]; arrastar: [arrastando: boolean] }>()

const { state, toggleSidebar } = useSidebar()
const expandido = computed(() => state.value === 'expanded')
let arraste: { x: number; largura: number; moveu: boolean } | null = null

function iniciar(evento: PointerEvent) {
  if (!expandido.value || evento.button !== 0) return
  ;(evento.currentTarget as HTMLElement).setPointerCapture?.(evento.pointerId)
  arraste = { x: evento.clientX, largura: props.largura, moveu: false }
}

function mover(evento: PointerEvent) {
  if (!arraste) return
  const deslocamento = evento.clientX - arraste.x
  if (!arraste.moveu && Math.abs(deslocamento) < 3) return
  if (!arraste.moveu) {
    arraste.moveu = true
    emit('arrastar', true)
  }
  emit('alterar', arraste.largura + deslocamento)
}

function terminar() {
  if (arraste?.moveu) emit('arrastar', false)
}

function clicar() {
  const moveu = arraste?.moveu
  arraste = null
  if (!moveu) toggleSidebar()
}

function teclar(evento: KeyboardEvent) {
  const passo = (
    { ArrowRight: PASSO_TECLADO, ArrowLeft: -PASSO_TECLADO } as Record<string, number>
  )[evento.key]
  if (!passo || !expandido.value) return
  evento.preventDefault()
  emit('alterar', props.largura + passo)
}
</script>

<template>
  <button
    type="button"
    data-sidebar="rail"
    data-slot="sidebar-rail"
    role="separator"
    aria-orientation="vertical"
    aria-label="Largura do menu"
    :aria-valuemin="LARGURA_MINIMA"
    :aria-valuemax="LARGURA_MAXIMA"
    :aria-valuenow="largura"
    :title="expandido ? 'Arraste para ajustar a largura · clique para recolher' : 'Expandir menu'"
    :class="
      cn(
        'absolute inset-y-0 -right-4 z-20 hidden w-4 -translate-x-1/2 touch-none sm:flex',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border focus-visible:outline-hidden focus-visible:after:bg-sidebar-ring',
        expandido ? 'cursor-col-resize' : 'cursor-e-resize',
      )
    "
    @pointerdown="iniciar"
    @pointermove="mover"
    @pointerup="terminar"
    @pointercancel="terminar"
    @click="clicar"
    @keydown="teclar"
  />
</template>
