<script setup lang="ts">
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Spinner } from '@/components/ui/spinner'

/** Pede confirmação antes de uma ação que não se desfaz (excluir, remover acesso). */
withDefaults(
  defineProps<{
    aberto: boolean
    titulo: string
    rotuloDoBotao: string
    processando: boolean
    destrutivo?: boolean
  }>(),
  { destrutivo: true },
)
const emit = defineEmits<{ confirmar: []; fechar: [] }>()
</script>

<template>
  <Dialog :open="aberto" @update:open="(abrir) => !abrir && emit('fechar')">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>{{ titulo }}</DialogTitle>
        <DialogDescription><slot /></DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="emit('fechar')">Cancelar</Button>
        <Button
          :variant="destrutivo ? 'destructive' : 'default'"
          :disabled="processando"
          @click="emit('confirmar')"
        >
          <Spinner v-if="processando" data-icon="inline-start" />
          {{ rotuloDoBotao }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
