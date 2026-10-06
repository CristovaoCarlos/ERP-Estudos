<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { getToken } from '@/lib/api'
import { useUsuario } from '@/lib/auth'
import { subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'
import { useControleDeSessao } from '@/lib/sessao'
import Landing from '@/pages/Landing.vue'

const route = useRoute()
const router = useRouter()
const usuario = useUsuario()
const prefeitura = usePrefeitura(subdominioDaPrefeitura())

/** A sessão caiu por inatividade: o login explica o motivo (ver `lib/sessao.ts`). */
const encerradaPorInatividade = ref(false)
useControleDeSessao(
  () => usuario.data.value?.inatividade_minutos ?? 5,
  () => (encerradaPorInatividade.value = true),
)

/** Sem sessão, a raiz mostra a landing da prefeitura; as outras telas vão para o login. */
const landing = computed(
  () => getToken() === null && route.path === '/' && !encerradaPorInatividade.value,
)

watchEffect(() => {
  if (landing.value) return
  if (getToken() === null || usuario.isError.value) {
    router.replace({
      path: '/login',
      query: encerradaPorInatividade.value ? { sessao: 'inatividade' } : {},
      state: { de: route.fullPath },
    })
  }
})
</script>

<template>
  <Landing v-if="landing" :prefeitura="prefeitura.data.value?.id" />
  <p v-else-if="usuario.isPending.value" class="p-8 text-muted-foreground">Carregando…</p>
  <RouterView v-else-if="usuario.data.value" />
</template>
