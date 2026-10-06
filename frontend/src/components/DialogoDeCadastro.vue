<script setup lang="ts">
import ConteudoDoFormulario from '@/components/ConteudoDoFormulario.vue'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FieldGroup } from '@/components/ui/field'
import { Spinner } from '@/components/ui/spinner'

/**
 * Moldura dos formulários de inclusão e alteração: diálogo, formulário e rodapé com Cancelar e o
 * botão de envio (Cadastrar, ou `rotuloDoBotao`). A tela só declara os campos e o envio.
 */
withDefaults(
  defineProps<{
    /** Liga o botão Cadastrar ao formulário. */
    id: string
    titulo: string
    descricao: string
    salvando: boolean
    largo?: boolean
    /** Texto do botão de envio: Cadastrar na inclusão, Salvar na alteração. */
    rotuloDoBotao?: string
  }>(),
  { largo: false, rotuloDoBotao: 'Cadastrar' },
)
const emit = defineEmits<{ enviar: [evento: Event]; fechar: [] }>()
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <ConteudoDoFormulario :chave="id" :largura="largo ? 'sm:w-2xl' : undefined">
      <DialogHeader>
        <DialogTitle>{{ titulo }}</DialogTitle>
        <DialogDescription>{{ descricao }}</DialogDescription>
      </DialogHeader>
      <form :id="id" novalidate @submit="(evento) => emit('enviar', evento)">
        <FieldGroup>
          <slot />
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button variant="outline" @click="emit('fechar')">Cancelar</Button>
        <Button type="submit" :form="id" :disabled="salvando">
          <Spinner v-if="salvando" data-icon="inline-start" />
          {{ rotuloDoBotao }}
        </Button>
      </DialogFooter>
    </ConteudoDoFormulario>
  </Dialog>
</template>
