<script setup lang="ts">
import { ShieldX } from '@lucide/vue'
import type { Component } from 'vue'

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useUsuario } from '@/lib/auth'
import { podeAcessar } from '@/lib/navegacao'

/** Mostra a tela só para quem tem a permissão dela (ver `permissaoDaTela`). */
defineProps<{ url: string; pagina: Component }>()

const usuario = useUsuario()
</script>

<template>
  <component :is="pagina" v-if="podeAcessar(url, usuario.data.value?.permissoes ?? [])" />
  <Empty v-else class="flex-1 border border-dashed">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <ShieldX />
      </EmptyMedia>
      <EmptyTitle>Sem acesso</EmptyTitle>
      <EmptyDescription>
        Você não tem permissão para esta tela. Fale com o administrador da sua prefeitura.
      </EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>
