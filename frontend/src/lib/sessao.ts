import { useQueryClient } from '@tanstack/vue-query'
import { useEventListener, useIntervalFn, useThrottleFn } from '@vueuse/core'
import { toValue, type MaybeRefOrGetter } from 'vue'

import { api, getToken, getUltimaRequisicao, setToken, TOKEN_KEY } from '@/lib/api'

/** Última atividade do usuário (ms), compartilhada entre as abas pelo `localStorage`. */
export const ATIVIDADE_KEY = 'erp_estudos.atividade'

/** O que conta como "o usuário está aqui". */
const EVENTOS_DE_ATIVIDADE = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'wheel', 'scroll']

function atividadeDeOutraAba() {
  try {
    return Number(localStorage.getItem(ATIVIDADE_KEY)) || 0
  } catch {
    return 0
  }
}

/**
 * Logout automático após `minutos` sem uso (ADR-0017).
 *
 * - Mouse, teclado, toque ou rolagem renovam o prazo, e o renovam em todas as abas.
 * - Se o usuário está ativo, mas a última requisição já passou da metade do prazo, avisa o servidor
 *   (`POST /sessao/renovar`), que também expira o token ocioso.
 * - Esgotado o prazo, revoga o token, limpa o cache e chama `aoExpirar` (quem redireciona é a `RotaProtegida`).
 *
 * O prazo é conferido por horário a cada segundo, não por um `setTimeout` longo, para continuar
 * certo com a aba em segundo plano ou depois de o computador hibernar.
 */
export function useControleDeSessao(minutos: MaybeRefOrGetter<number>, aoExpirar: () => void) {
  const queryClient = useQueryClient()
  let ultimaAtividade = Date.now()

  const prazo = () => toValue(minutos) * 60_000
  const expirou = () => Date.now() - Math.max(ultimaAtividade, atividadeDeOutraAba()) >= prazo()

  function registrarAtividade() {
    if (getToken() === null) return
    ultimaAtividade = Date.now()
    try {
      localStorage.setItem(ATIVIDADE_KEY, String(ultimaAtividade))
    } catch {
      // Sem localStorage, o controle vale só para esta aba.
    }
    if (ultimaAtividade - getUltimaRequisicao() > prazo() / 2) {
      api.post('/sessao/renovar').catch(() => {})
    }
  }

  function encerrar() {
    const token = getToken()
    aoExpirar()
    setToken(null)
    // O token já saiu do estado: o header vai explícito e um 401 aqui não redireciona de novo.
    api.post('/logout', null, { headers: { Authorization: `Bearer ${token}` } }).catch(() => {})
    queryClient.clear()
  }

  function verificar() {
    if (getToken() !== null && expirou()) encerrar()
  }

  const aoInteragir = useThrottleFn(registrarAtividade, 1000)
  for (const evento of EVENTOS_DE_ATIVIDADE) {
    // `capture` pega também a rolagem de áreas internas, que não chega ao window pelo bubbling.
    useEventListener(window, evento, aoInteragir, { capture: true, passive: true })
  }
  // Ao voltar para a aba, confere na hora, sem esperar o próximo segundo.
  useEventListener(document, 'visibilitychange', verificar)
  useEventListener(window, 'storage', (evento) => {
    if (evento.key === ATIVIDADE_KEY) {
      ultimaAtividade = Math.max(ultimaAtividade, Number(evento.newValue) || 0)
    }
    // Outra aba encerrou a sessão por inatividade: esta mostra o mesmo motivo.
    if (evento.key === TOKEN_KEY && evento.newValue === null && expirou()) aoExpirar()
  })
  useIntervalFn(verificar, 1000)
}
