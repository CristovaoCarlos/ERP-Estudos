<script setup lang="ts">
import { MapPinned, Pencil, Plus } from '@lucide/vue'
import { computed, ref } from 'vue'

import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCidades, type Cidade } from '@/lib/administracao-tabelas-comuns-cidades'
import { useSelecao, type Coluna } from '@/lib/listagem'
import AlterarCidade from '@/pages/administracao/tabelas-comuns/cidades/AlterarCidade.vue'
import NovaCidade from '@/pages/administracao/tabelas-comuns/cidades/NovaCidade.vue'

const colunas: Coluna<Cidade>[] = [
  {
    id: 'nome',
    titulo: 'Cidade',
    className: 'font-medium',
    valor: (cidade) => cidade.nome,
    busca: (cidade) => cidade.nome,
  },
  { id: 'uf', titulo: 'UF', className: 'w-20', busca: (cidade) => cidade.uf },
  {
    id: 'codigo_ibge',
    titulo: 'Código IBGE',
    className: 'w-36 font-mono text-muted-foreground',
    valor: (cidade) => cidade.codigo_ibge,
    busca: (cidade) => cidade.codigo_ibge,
  },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-16 text-right' },
]

const cadastrando = ref(false)
const emEdicao = ref<Cidade | null>(null)
const cidades = useCidades()
const filtro = useSelecao<string>()

const todasAsUfs = computed(() =>
  [...new Set(cidades.data.value?.map((cidade) => cidade.uf))].sort(),
)

const filtradas = computed(() =>
  filtro.selecionados.value.length
    ? cidades.data.value?.filter((cidade) => filtro.selecionados.value.includes(cidade.uf))
    : cidades.data.value,
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Cidades</h1>
        <p class="text-muted-foreground">Todos os Municípios com UF e código IBGE.</p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Nova cidade
      </Button>
    </div>

    <Listagem
      chave="administracao-tabelas-comuns-cidades"
      :itens="filtradas"
      :carregando="cidades.isPending.value"
      :erro="cidades.isError.value"
      :colunas="colunas"
      :identificador="(cidade) => cidade.id"
      placeholder="Buscar por cidade, UF ou código IBGE…"
      :filtros-ativos="filtro.selecionados.value.length"
      :vazio="{
        titulo: 'Nenhuma cidade',
        descricao: 'A tabela de cidades do banco central está vazia.',
        icone: MapPinned,
      }"
      @limpar-filtros="filtro.limpar"
    >
      <template #filtros>
        <!-- 27 UFs: a lista rola dentro do menu. -->
        <div class="max-h-72 overflow-y-auto">
          <ItemDeFiltro
            v-for="uf in todasAsUfs"
            :key="uf"
            :marcado="filtro.selecionados.value.includes(uf)"
            @alternar="(marcado) => filtro.alternar(uf, marcado)"
          >
            {{ uf }}
          </ItemDeFiltro>
        </div>
      </template>
      <template #coluna-uf="{ item }">
        <Badge variant="outline">{{ item.uf }}</Badge>
      </template>
      <template #coluna-acoes="{ item }">
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`Alterar ${item.nome}`"
          @click="emEdicao = item"
        >
          <Pencil />
        </Button>
      </template>
    </Listagem>

    <NovaCidade v-if="cadastrando" @fechar="cadastrando = false" />
    <AlterarCidade v-if="emEdicao" :cidade="emEdicao" @fechar="emEdicao = null" />
  </div>
</template>
