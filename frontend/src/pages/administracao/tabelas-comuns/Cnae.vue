<script setup lang="ts">
import { ListTree, Plus } from '@lucide/vue'
import { computed, ref } from 'vue'

import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { niveis, useCnae, type Cnae, type Nivel } from '@/lib/administracao-tabelas-comuns-cnae'
import { useSelecao, type Coluna } from '@/lib/listagem'
import NovaAtividade from '@/pages/administracao/tabelas-comuns/cnae/NovaAtividade.vue'

const rotuloDoNivel = Object.fromEntries(niveis.map(({ valor, rotulo }) => [valor, rotulo]))

/** Recuo da denominação conforme o nível, para a hierarquia aparecer na lista. */
const recuo: Record<Nivel, string> = {
  secao: 'font-semibold',
  divisao: 'pl-3 font-medium',
  grupo: 'pl-6',
  classe: 'pl-9',
  subclasse: 'pl-12 text-muted-foreground',
}

const colunas: Coluna<Cnae>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-28 font-mono whitespace-nowrap',
    valor: (cnae) => cnae.codigo,
    busca: (cnae) => `${cnae.codigo} ${cnae.codigo.replace(/\D/g, '')}`,
  },
  { id: 'denominacao', titulo: 'Denominação', busca: (cnae) => cnae.denominacao },
  { id: 'nivel', titulo: 'Nível', className: 'w-28' },
  {
    id: 'secao',
    titulo: 'Seção',
    className: 'w-20',
    ocultaPorPadrao: true,
    valor: (cnae) => cnae.secao,
  },
  {
    id: 'versao',
    titulo: 'Versão',
    className: 'w-20 text-muted-foreground',
    valor: (cnae) => cnae.versao ?? '—',
  },
  { id: 'situacao', titulo: 'Situação', className: 'w-24' },
]

type Situacao = 'ativa' | 'inativa'

const situacoes = [
  { valor: 'ativa', rotulo: 'Ativa' },
  { valor: 'inativa', rotulo: 'Inativa' },
] as const

const cadastrando = ref(false)
const cnae = useCnae()
const versoes = useSelecao<string>()
const niveisMarcados = useSelecao<Nivel>()
const situacoesMarcadas = useSelecao<Situacao>()

const todasAsVersoes = computed(() =>
  [...new Set(cnae.data.value?.map((atividade) => atividade.versao ?? ''))]
    .filter(Boolean)
    .sort()
    .reverse(),
)

const filtradas = computed(() =>
  cnae.data.value?.filter(
    (atividade) =>
      (!versoes.selecionados.value.length ||
        versoes.selecionados.value.includes(atividade.versao ?? '')) &&
      (!niveisMarcados.selecionados.value.length ||
        niveisMarcados.selecionados.value.includes(atividade.nivel)) &&
      (!situacoesMarcadas.selecionados.value.length ||
        situacoesMarcadas.selecionados.value.includes(atividade.ativo ? 'ativa' : 'inativa')),
  ),
)

const filtrosAtivos = computed(
  () =>
    versoes.selecionados.value.length +
    niveisMarcados.selecionados.value.length +
    situacoesMarcadas.selecionados.value.length,
)

function limparFiltros() {
  versoes.limpar()
  niveisMarcados.limpar()
  situacoesMarcadas.limpar()
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">CNAE</h1>
        <p class="text-muted-foreground">
          Classificação Nacional de Atividades Econômicas, da seção à subclasse.
        </p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Nova atividade
      </Button>
    </div>

    <Listagem
      chave="administracao-tabelas-comuns-cnae"
      :itens="filtradas"
      :carregando="cnae.isPending.value"
      :erro="cnae.isError.value"
      :colunas="colunas"
      :identificador="(atividade) => atividade.id"
      placeholder="Buscar por código ou denominação…"
      :filtros-ativos="filtrosAtivos"
      :vazio="{
        titulo: 'Nenhuma atividade',
        descricao: 'A tabela da CNAE do banco central está vazia.',
        icone: ListTree,
      }"
      @limpar-filtros="limparFiltros"
    >
      <template #filtros>
        <DropdownMenuLabel class="text-xs text-muted-foreground">Versão</DropdownMenuLabel>
        <ItemDeFiltro
          v-for="versao in todasAsVersoes"
          :key="versao"
          :marcado="versoes.selecionados.value.includes(versao)"
          @alternar="(marcado) => versoes.alternar(versao, marcado)"
        >
          {{ versao }}
        </ItemDeFiltro>
        <DropdownMenuSeparator />
        <DropdownMenuLabel class="text-xs text-muted-foreground">Nível</DropdownMenuLabel>
        <ItemDeFiltro
          v-for="nivel in niveis"
          :key="nivel.valor"
          :marcado="niveisMarcados.selecionados.value.includes(nivel.valor)"
          @alternar="(marcado) => niveisMarcados.alternar(nivel.valor, marcado)"
        >
          {{ nivel.rotulo }}
        </ItemDeFiltro>
        <DropdownMenuSeparator />
        <DropdownMenuLabel class="text-xs text-muted-foreground">Situação</DropdownMenuLabel>
        <ItemDeFiltro
          v-for="situacao in situacoes"
          :key="situacao.valor"
          :marcado="situacoesMarcadas.selecionados.value.includes(situacao.valor)"
          @alternar="(marcado) => situacoesMarcadas.alternar(situacao.valor, marcado)"
        >
          {{ situacao.rotulo }}
        </ItemDeFiltro>
      </template>
      <template #coluna-denominacao="{ item }">
        <span :class="recuo[item.nivel]">{{ item.denominacao }}</span>
      </template>
      <template #coluna-nivel="{ item }">
        <Badge variant="outline">{{ rotuloDoNivel[item.nivel] }}</Badge>
      </template>
      <template #coluna-situacao="{ item }">
        <Badge v-if="item.ativo" variant="secondary">Ativa</Badge>
        <Badge v-else variant="outline">Inativa</Badge>
      </template>
    </Listagem>

    <NovaAtividade
      v-if="cadastrando"
      :versao-padrao="todasAsVersoes[0] ?? ''"
      @fechar="cadastrando = false"
    />
  </div>
</template>
