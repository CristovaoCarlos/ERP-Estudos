<script setup lang="ts">
import { Construction } from '@lucide/vue'
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { localizar } from '@/lib/navegacao'

const route = useRoute()
const titulo = computed(() => localizar(route.path).at(-1)?.titulo ?? 'Página')
</script>

<template>
  <Empty class="flex-1 border border-dashed">
    <EmptyHeader>
      <EmptyMedia variant="icon">
        <Construction />
      </EmptyMedia>
      <EmptyTitle>{{ titulo }}</EmptyTitle>
      <EmptyDescription>Esta tela ainda está em construção.</EmptyDescription>
    </EmptyHeader>
  </Empty>
</template>
