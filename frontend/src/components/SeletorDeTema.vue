<script setup lang="ts">
import { Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'

import { Button } from '@/components/ui/button'
import { useTema } from '@/lib/tema'

/** Alterna entre o tema claro e o escuro. */
const tema = useTema()
const escuro = computed(() => tema.value === 'dark')
const rotulo = computed(() =>
  escuro.value ? 'Mudar para o tema claro' : 'Mudar para o tema escuro',
)
</script>

<template>
  <Button
    variant="outline"
    size="icon"
    :aria-label="rotulo"
    :title="rotulo"
    @click="tema = escuro ? 'light' : 'dark'"
  >
    <Sun class="scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
    <Moon class="absolute scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
  </Button>
</template>
