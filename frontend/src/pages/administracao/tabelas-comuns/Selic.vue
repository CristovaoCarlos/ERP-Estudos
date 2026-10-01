<script setup lang="ts">
import { Plus, TrendingUp } from '@lucide/vue'
import { computed, ref } from 'vue'

import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Button } from '@/components/ui/button'
import { useSelic, type Selic } from '@/lib/administracao-tabelas-comuns-selic'
import { useSelecao, type Coluna } from '@/lib/listagem'
import NovaTaxa from '@/pages/administracao/tabelas-comuns/selic/NovaTaxa.vue'
import {
  competencia,
  mesPorExtenso,
  percentual,
} from '@/pages/administracao/tabelas-comuns/selic/formato'

const colunas: Coluna<Selic>[] = [
  {
    id: 'competencia',
    titulo: 'Competência',
    className: 'w-32 font-mono',
    valor: competencia,
    busca: competencia,
  },
  {
    id: 'mes',
    titulo: 'Mês',
    valor: (selic) => `${mesPorExtenso(selic.mes)} de ${selic.ano}`,
    busca: (selic) => `${mesPorExtenso(selic.mes)} ${selic.ano}`,
  },
  { id: 'valor', titulo: 'Taxa', className: 'w-32 text-right tabular-nums' },
]

const cadastrando = ref(false)
const selic = useSelic()
const filtro = useSelecao<number>()

const todosOsAnos = computed(() =>
  [...new Set(selic.data.value?.map((taxa) => taxa.ano))].sort((a, b) => b - a),
)

const filtradas = computed(() =>
  filtro.selecionados.value.length
    ? selic.data.value?.filter((taxa) => filtro.selecionados.value.includes(taxa.ano))
    : selic.data.value,
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">SELIC</h1>
        <p class="text-muted-foreground">Taxa SELIC de cada mês, usada na correção de tributos.</p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Nova taxa
      </Button>
    </div>

    <Listagem
      chave="administracao-tabelas-comuns-selic"
      :itens="filtradas"
      :carregando="selic.isPending.value"
      :erro="selic.isError.value"
      :colunas="colunas"
      :identificador="(taxa) => taxa.id"
      placeholder="Buscar por competência ou mês…"
      :filtros-ativos="filtro.selecionados.value.length"
      :vazio="{
        titulo: 'Nenhuma taxa cadastrada',
        descricao: 'A tabela da SELIC do banco central ainda não tem nenhum mês.',
        icone: TrendingUp,
      }"
      @limpar-filtros="filtro.limpar"
    >
      <template #filtros>
        <div class="max-h-72 overflow-y-auto">
          <ItemDeFiltro
            v-for="ano in todosOsAnos"
            :key="ano"
            :marcado="filtro.selecionados.value.includes(ano)"
            @alternar="(marcado) => filtro.alternar(ano, marcado)"
          >
            {{ ano }}
          </ItemDeFiltro>
        </div>
      </template>
      <template #coluna-valor="{ item }">
        <span v-if="item.valor === null" class="text-muted-foreground">—</span>
        <template v-else>{{ percentual.format(Number(item.valor)) }}%</template>
      </template>
    </Listagem>

    <NovaTaxa v-if="cadastrando" @fechar="cadastrando = false" />
  </div>
</template>
