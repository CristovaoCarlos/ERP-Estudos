<script setup lang="ts">
import { Pencil, Plus, Shapes } from '@lucide/vue'
import { ref } from 'vue'

import Listagem from '@/components/Listagem.vue'
import { Button } from '@/components/ui/button'
import { useSegmentos, type Segmento } from '@/lib/administracao-tabelas-comuns-segmentos'
import type { Coluna } from '@/lib/listagem'
import AlterarSegmento from '@/pages/administracao/tabelas-comuns/segmentos/AlterarSegmento.vue'
import NovoSegmento from '@/pages/administracao/tabelas-comuns/segmentos/NovoSegmento.vue'

const colunas: Coluna<Segmento>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono',
    valor: (segmento) => segmento.codigo,
    busca: (segmento) => segmento.codigo,
  },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'font-medium',
    valor: (segmento) => segmento.descricao,
    busca: (segmento) => segmento.descricao,
  },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-16 text-right' },
]

const cadastrando = ref(false)
const segmentos = useSegmentos()
const emEdicao = ref<Segmento | null>(null)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Segmentos</h1>
        <p class="text-muted-foreground">
          Segmentos de arrecadação da FEBRABAN, usados no código de barras dos convênios.
        </p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Novo segmento
      </Button>
    </div>

    <Listagem
      chave="administracao-tabelas-comuns-segmentos"
      :itens="segmentos.data.value"
      :carregando="segmentos.isPending.value"
      :erro="segmentos.isError.value"
      :colunas="colunas"
      :identificador="(segmento) => segmento.codigo"
      placeholder="Buscar por código ou descrição…"
      :vazio="{
        titulo: 'Nenhum segmento',
        descricao: 'A tabela de segmentos do banco central está vazia.',
        icone: Shapes,
      }"
    >
      <template #coluna-acoes="{ item }">
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`Alterar ${item.descricao}`"
          @click="emEdicao = item"
        >
          <Pencil />
        </Button>
      </template>
    </Listagem>

    <AlterarSegmento v-if="emEdicao" :segmento="emEdicao" @fechar="emEdicao = null" />
    <NovoSegmento v-if="cadastrando" @fechar="cadastrando = false" />
  </div>
</template>
