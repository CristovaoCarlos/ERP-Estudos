<script setup lang="ts">
import { DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'

/** Opção do menu Filtros da listagem. Marcar não fecha o menu. */
defineProps<{ marcado: boolean }>()
const emit = defineEmits<{ alternar: [marcado: boolean] }>()
</script>

<template>
  <DropdownMenuCheckboxItem
    :model-value="marcado"
    @update:model-value="(valor) => emit('alternar', valor === true)"
    @select="(evento: Event) => evento.preventDefault()"
  >
    <slot />
  </DropdownMenuCheckboxItem>
</template>
