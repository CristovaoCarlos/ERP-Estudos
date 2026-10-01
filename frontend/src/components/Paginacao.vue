<script setup lang="ts">
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from '@lucide/vue'

import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/** Rodapé da listagem: total de registros, tamanho da página e navegação. */
defineProps<{ total: number; pagina: number; paginas: number; porPagina: number }>()
const emit = defineEmits<{ mudarPagina: [pagina: number]; mudarPorPagina: [quantidade: number] }>()

const POR_PAGINA = [15, 30, 50, 100]
</script>

<template>
  <div
    class="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-3 py-2 text-sm"
  >
    <span class="text-muted-foreground">
      {{ total }} {{ total === 1 ? 'registro' : 'registros' }}
    </span>
    <div class="ml-auto flex flex-wrap items-center gap-3">
      <div class="flex items-center gap-2">
        <span class="text-muted-foreground">Por página</span>
        <Select
          :model-value="String(porPagina)"
          @update:model-value="(valor) => emit('mudarPorPagina', Number(valor))"
        >
          <SelectTrigger size="sm" class="w-20 bg-background" aria-label="Por página">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="quantidade in POR_PAGINA"
              :key="quantidade"
              :value="String(quantidade)"
            >
              {{ quantidade }}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <span class="text-muted-foreground">Página {{ pagina }} de {{ paginas }}</span>
      <div class="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          aria-label="Primeira página"
          :disabled="pagina === 1"
          @click="emit('mudarPagina', 1)"
        >
          <ChevronsLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          aria-label="Página anterior"
          :disabled="pagina === 1"
          @click="emit('mudarPagina', pagina - 1)"
        >
          <ChevronLeft />
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          aria-label="Próxima página"
          :disabled="pagina === paginas"
          @click="emit('mudarPagina', pagina + 1)"
        >
          <ChevronRight />
        </Button>
        <Button
          variant="outline"
          size="icon"
          class="size-8"
          aria-label="Última página"
          :disabled="pagina === paginas"
          @click="emit('mudarPagina', paginas)"
        >
          <ChevronsRight />
        </Button>
      </div>
    </div>
  </div>
</template>
