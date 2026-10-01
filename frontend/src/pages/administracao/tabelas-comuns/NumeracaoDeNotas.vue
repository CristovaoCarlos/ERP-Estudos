<script setup lang="ts">
import { Hash, Plus } from '@lucide/vue'
import { ref } from 'vue'

import Listagem from '@/components/Listagem.vue'
import { Button } from '@/components/ui/button'
import {
  useNumeracaoDeNotas,
  type NotaNumeracao,
} from '@/lib/administracao-tabelas-comuns-numeracao-de-notas'
import type { Coluna } from '@/lib/listagem'
import NovaNumeracao from '@/pages/administracao/tabelas-comuns/numeracao-de-notas/NovaNumeracao.vue'

const colunas: Coluna<NotaNumeracao>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono',
    valor: (numeracao) => numeracao.codigo,
    busca: (numeracao) => numeracao.codigo,
  },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'font-medium',
    valor: (numeracao) => numeracao.descricao,
    busca: (numeracao) => numeracao.descricao,
  },
]

const cadastrando = ref(false)
const numeracoes = useNumeracaoDeNotas()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Numeração de Notas</h1>
        <p class="text-muted-foreground">Tipos de numeração da nota fiscal.</p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Nova numeração
      </Button>
    </div>

    <Listagem
      chave="administracao-tabelas-comuns-numeracao-de-notas"
      :itens="numeracoes.data.value"
      :carregando="numeracoes.isPending.value"
      :erro="numeracoes.isError.value"
      :colunas="colunas"
      :identificador="(numeracao) => numeracao.codigo"
      placeholder="Buscar por código ou descrição…"
      :vazio="{
        titulo: 'Nenhum tipo de numeração',
        descricao: 'A tabela de numeração de notas do banco central está vazia.',
        icone: Hash,
      }"
    />

    <NovaNumeracao v-if="cadastrando" @fechar="cadastrando = false" />
  </div>
</template>
