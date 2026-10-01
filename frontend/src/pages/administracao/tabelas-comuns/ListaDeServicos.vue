<script setup lang="ts">
import { ListChecks, Pencil, Plus } from '@lucide/vue'
import { computed, ref } from 'vue'

import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  useListaDeServicos,
  type ItemLcp116,
} from '@/lib/administracao-tabelas-comuns-lista-de-servicos'
import { useSelecao, type Coluna } from '@/lib/listagem'
import AlterarItem from '@/pages/administracao/tabelas-comuns/lista-de-servicos/AlterarItem.vue'
import NovoItem from '@/pages/administracao/tabelas-comuns/lista-de-servicos/NovoItem.vue'

const colunas: Coluna<ItemLcp116>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono whitespace-nowrap',
    valor: (item) => item.codigo,
    busca: (item) => `${item.codigo} ${item.codigo.replace('.', '')}`,
  },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'whitespace-normal',
    busca: (item) => item.descricao,
  },
  { id: 'tipo', titulo: 'Tipo', className: 'w-24', ocultaPorPadrao: true },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-16 text-right' },
]

const tipos = [
  { valor: 'item', rotulo: 'Itens' },
  { valor: 'subitem', rotulo: 'Subitens' },
] as const

const cadastrando = ref(false)
const itens = useListaDeServicos()
const emEdicao = ref<ItemLcp116 | null>(null)
const filtro = useSelecao<ItemLcp116['tipo']>()

const filtrados = computed(() =>
  filtro.selecionados.value.length
    ? itens.data.value?.filter((item) => filtro.selecionados.value.includes(item.tipo))
    : itens.data.value,
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">
          Lista de Serviços - Lei Compl. 116/2003
        </h1>
        <p class="text-muted-foreground">Itens e subitens da lista de serviços do ISS.</p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Novo item
      </Button>
    </div>

    <Listagem
      chave="administracao-tabelas-comuns-lista-de-servicos"
      :itens="filtrados"
      :carregando="itens.isPending.value"
      :erro="itens.isError.value"
      :colunas="colunas"
      :identificador="(item) => item.codigo"
      placeholder="Buscar por código ou descrição…"
      :filtros-ativos="filtro.selecionados.value.length"
      :vazio="{
        titulo: 'Nenhum item',
        descricao: 'A lista de serviços do banco central está vazia.',
        icone: ListChecks,
      }"
      @limpar-filtros="filtro.limpar"
    >
      <template #filtros>
        <ItemDeFiltro
          v-for="tipo in tipos"
          :key="tipo.valor"
          :marcado="filtro.selecionados.value.includes(tipo.valor)"
          @alternar="(marcado) => filtro.alternar(tipo.valor, marcado)"
        >
          {{ tipo.rotulo }}
        </ItemDeFiltro>
      </template>
      <template #coluna-descricao="{ item }">
        <!-- Subitens com recuo, abaixo do item a que pertencem. -->
        <span v-if="item.tipo === 'item'" class="font-semibold">{{ item.descricao }}</span>
        <span v-else class="block pl-4">{{ item.descricao }}</span>
      </template>
      <template #coluna-tipo="{ item }">
        <Badge variant="outline">{{ item.tipo === 'item' ? 'Item' : 'Subitem' }}</Badge>
      </template>
      <template #coluna-acoes="{ item }">
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`Alterar ${item.codigo}`"
          @click="emEdicao = item"
        >
          <Pencil />
        </Button>
      </template>
    </Listagem>

    <AlterarItem v-if="emEdicao" :item="emEdicao" @fechar="emEdicao = null" />
    <NovoItem v-if="cadastrando" @fechar="cadastrando = false" />
  </div>
</template>
