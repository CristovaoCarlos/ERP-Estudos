<script setup lang="ts">
import type { LucideIcon } from '@lucide/vue'

import Rotulo from '@/components/landing/Rotulo.vue'

export type Item = { icone: LucideIcon; titulo: string; texto: string }

defineProps<{ id: string; rotulo: string; titulo: string; itens: Item[]; numerada?: boolean }>()
</script>

<template>
  <section :id="id" class="scroll-mt-16 border-t">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
      <div class="flex max-w-2xl flex-col gap-4">
        <Rotulo>{{ rotulo }}</Rotulo>
        <h2 class="text-3xl font-semibold tracking-tight text-balance">{{ titulo }}</h2>
      </div>
      <ol
        class="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4"
      >
        <li
          v-for="(item, i) in itens"
          :key="item.titulo"
          class="flex flex-col gap-3 bg-background p-6"
        >
          <div class="flex items-center justify-between">
            <component :is="item.icone" class="size-5 text-marca" />
            <span v-if="numerada" class="font-mono text-xs text-muted-foreground">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
          </div>
          <h3 class="font-medium">{{ item.titulo }}</h3>
          <p class="text-sm text-pretty text-muted-foreground">{{ item.texto }}</p>
        </li>
      </ol>
    </div>
  </section>
</template>
