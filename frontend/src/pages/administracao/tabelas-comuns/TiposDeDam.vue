<script setup lang="ts">
import { FileType, Plus } from '@lucide/vue'
import { ref } from 'vue'

import Listagem from '@/components/Listagem.vue'
import { Button } from '@/components/ui/button'
import { useTiposDeDam, type DamTipo } from '@/lib/administracao-tabelas-comuns-tipos-de-dam'
import type { Coluna } from '@/lib/listagem'
import NovoTipoDeDam from '@/pages/administracao/tabelas-comuns/tipos-de-dam/NovoTipoDeDam.vue'

const colunas: Coluna<DamTipo>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono',
    valor: (tipo) => tipo.codigo,
    busca: (tipo) => String(tipo.codigo),
  },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'font-medium',
    valor: (tipo) => tipo.descricao,
    busca: (tipo) => tipo.descricao,
  },
]

const cadastrando = ref(false)
const tipos = useTiposDeDam()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Tipos de DAM</h1>
        <p class="text-muted-foreground">Tipos de documento de arrecadação.</p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Novo tipo de DAM
      </Button>
    </div>

    <Listagem
      chave="administracao-tabelas-comuns-tipos-de-dam"
      :itens="tipos.data.value"
      :carregando="tipos.isPending.value"
      :erro="tipos.isError.value"
      :colunas="colunas"
      :identificador="(tipo) => tipo.codigo"
      placeholder="Buscar por código ou descrição…"
      :vazio="{
        titulo: 'Nenhum tipo de DAM',
        descricao: 'A tabela de tipos de DAM do banco central está vazia.',
        icone: FileType,
      }"
    />

    <NovoTipoDeDam v-if="cadastrando" @fechar="cadastrando = false" />
  </div>
</template>
