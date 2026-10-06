<script setup lang="ts">
import { ComboboxInput } from 'reka-ui'
import { computed, ref, type Component } from 'vue'

import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxViewport,
} from '@/components/ui/combobox'
import { CLASSES_DO_CAMPO_DE_BUSCA, normalizarBusca } from '@/lib/busca'

/** Opção da lista. `documento` (CPF/CNPJ só com dígitos) também é achado pelos números digitados. */
export type OpcaoDeBusca = { valor: string; rotulo: string; detalhe?: string; documento?: string }

/**
 * Escolha de um item de uma lista longa (clientes, vendedores) digitando parte do nome, sem
 * acentos. Mostra até 50 resultados. Apagar o texto limpa a escolha (`''`).
 */
const props = defineProps<{
  id: string
  opcoes: OpcaoDeBusca[]
  placeholder: string
  /** Aviso quando nada bate com o que foi digitado. */
  vazio: string
  icone: Component
  invalido?: boolean
}>()
const escolhido = defineModel<string>({ required: true })

const busca = ref('')
const encontradas = computed(() => {
  const termo = normalizarBusca(busca.value)
  const digitos = busca.value.replace(/\D/g, '')
  return props.opcoes
    .filter(
      (opcao) =>
        normalizarBusca(opcao.rotulo).includes(termo) ||
        (digitos !== '' && !!opcao.documento?.includes(digitos)),
    )
    .slice(0, 50)
})
const rotulo = (valor: unknown) => props.opcoes.find((opcao) => opcao.valor === valor)?.rotulo ?? ''
</script>

<template>
  <Combobox
    :model-value="escolhido || undefined"
    ignore-filter
    open-on-click
    reset-model-value-on-clear
    @update:model-value="(valor) => (escolhido = valor ? String(valor) : '')"
  >
    <ComboboxAnchor class="relative w-full">
      <component
        :is="icone"
        class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
      />
      <ComboboxInput
        :id="id"
        v-model="busca"
        :display-value="rotulo"
        :placeholder="placeholder"
        autocomplete="off"
        :class="CLASSES_DO_CAMPO_DE_BUSCA"
        :aria-invalid="invalido || undefined"
      />
    </ComboboxAnchor>
    <ComboboxList class="w-(--reka-combobox-trigger-width)" align="start">
      <ComboboxViewport class="p-1">
        <ComboboxEmpty>{{ vazio }}</ComboboxEmpty>
        <ComboboxItem v-for="opcao in encontradas" :key="opcao.valor" :value="opcao.valor">
          <span class="truncate">{{ opcao.rotulo }}</span>
          <span v-if="opcao.detalhe" class="ml-auto font-mono text-xs text-muted-foreground">
            {{ opcao.detalhe }}
          </span>
        </ComboboxItem>
      </ComboboxViewport>
    </ComboboxList>
  </Combobox>
</template>
