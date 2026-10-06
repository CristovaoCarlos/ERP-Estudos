<script setup lang="ts">
import { Pencil, Plus, Ruler } from '@lucide/vue'
import { ref } from 'vue'

import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUnidades, type Unidade } from '@/lib/administracao-tabelas-comuns-unidades'
import type { Coluna } from '@/lib/listagem'
import AlterarUnidade from '@/pages/administracao/tabelas-comuns/unidades/AlterarUnidade.vue'
import NovaUnidade from '@/pages/administracao/tabelas-comuns/unidades/NovaUnidade.vue'

const colunas: Coluna<Unidade>[] = [
  { id: 'sigla', titulo: 'Sigla', className: 'w-28', busca: (unidade) => unidade.sigla },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'font-medium',
    valor: (unidade) => unidade.descricao,
    busca: (unidade) => unidade.descricao,
  },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-16 text-right' },
]

const cadastrando = ref(false)
const emEdicao = ref<Unidade | null>(null)
const unidades = useUnidades()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Unidades</h1>
        <p class="text-muted-foreground">
          Unidades de medida dos produtos (UN, KG, L…), as mesmas para todas as prefeituras.
        </p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Nova unidade
      </Button>
    </div>

    <Listagem
      chave="administracao-tabelas-comuns-unidades"
      :itens="unidades.data.value"
      :carregando="unidades.isPending.value"
      :erro="unidades.isError.value"
      :colunas="colunas"
      :identificador="(unidade) => unidade.sigla"
      placeholder="Buscar por sigla ou descrição…"
      :vazio="{
        titulo: 'Nenhuma unidade',
        descricao: 'Cadastre a primeira em “Nova unidade”.',
        icone: Ruler,
      }"
    >
      <template #coluna-sigla="{ item }">
        <Badge variant="outline" class="font-mono">{{ item.sigla }}</Badge>
      </template>
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

    <NovaUnidade v-if="cadastrando" @fechar="cadastrando = false" />
    <AlterarUnidade v-if="emEdicao" :unidade="emEdicao" @fechar="emEdicao = null" />
  </div>
</template>
