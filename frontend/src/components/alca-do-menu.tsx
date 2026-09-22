import * as React from 'react'

import { useSidebar } from '@/components/ui/sidebar'
import { LARGURA_MAXIMA, LARGURA_MINIMA, PASSO_TECLADO } from '@/hooks/use-largura-do-menu'
import { cn } from '@/lib/utils'

/**
 * Borda direita do menu: arrastar ajusta a largura e clique recolhe/expande.
 * Pelo teclado, as setas ajustam a largura.
 */
export function AlcaDoMenu({
  largura,
  aoAlterar,
  aoArrastar,
}: {
  largura: number
  aoAlterar: (largura: number) => void
  aoArrastar: (arrastando: boolean) => void
}) {
  const { state, toggleSidebar } = useSidebar()
  const arraste = React.useRef<{ x: number; largura: number; moveu: boolean } | null>(null)
  const expandido = state === 'expanded'

  const iniciar = (evento: React.PointerEvent<HTMLButtonElement>) => {
    if (!expandido || evento.button !== 0) return
    evento.currentTarget.setPointerCapture?.(evento.pointerId)
    arraste.current = { x: evento.clientX, largura, moveu: false }
  }

  const mover = (evento: React.PointerEvent<HTMLButtonElement>) => {
    const atual = arraste.current
    if (!atual) return
    const deslocamento = evento.clientX - atual.x
    if (!atual.moveu && Math.abs(deslocamento) < 3) return
    if (!atual.moveu) {
      atual.moveu = true
      aoArrastar(true)
    }
    aoAlterar(atual.largura + deslocamento)
  }

  const terminar = () => {
    if (arraste.current?.moveu) aoArrastar(false)
  }

  const clicar = () => {
    const moveu = arraste.current?.moveu
    arraste.current = null
    if (!moveu) toggleSidebar()
  }

  const teclar = (evento: React.KeyboardEvent<HTMLButtonElement>) => {
    const passo = { ArrowRight: PASSO_TECLADO, ArrowLeft: -PASSO_TECLADO }[evento.key]
    if (!passo || !expandido) return
    evento.preventDefault()
    aoAlterar(largura + passo)
  }

  return (
    <button
      type="button"
      data-sidebar="rail"
      data-slot="sidebar-rail"
      role="separator"
      aria-orientation="vertical"
      aria-label="Largura do menu"
      aria-valuemin={LARGURA_MINIMA}
      aria-valuemax={LARGURA_MAXIMA}
      aria-valuenow={largura}
      title={expandido ? 'Arraste para ajustar a largura · clique para recolher' : 'Expandir menu'}
      onPointerDown={iniciar}
      onPointerMove={mover}
      onPointerUp={terminar}
      onPointerCancel={terminar}
      onClick={clicar}
      onKeyDown={teclar}
      className={cn(
        'absolute inset-y-0 -right-4 z-20 hidden w-4 -translate-x-1/2 touch-none sm:flex',
        'after:absolute after:inset-y-0 after:left-1/2 after:w-[2px] hover:after:bg-sidebar-border focus-visible:outline-hidden focus-visible:after:bg-sidebar-ring',
        expandido ? 'cursor-col-resize' : 'cursor-e-resize',
      )}
    />
  )
}
