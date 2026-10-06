<script setup lang="ts">
import { Package, Pencil, Plus, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import DialogoDeConfirmacao from '@/components/DialogoDeConfirmacao.vue'
import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { formatarNcm, useProdutos, useRemoverProduto, type Produto } from '@/lib/cadastros-produtos'
import { useSelecao, type Coluna } from '@/lib/listagem'
import { formatarMoeda, formatarQuantidade } from '@/lib/numeros'
import FormularioDeProduto from '@/pages/cadastros/produtos/FormularioDeProduto.vue'

const colunas: Coluna<Produto>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-32 font-mono text-xs',
    valor: (produto) => produto.codigo,
    busca: (produto) => produto.codigo,
  },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'font-medium',
    busca: (produto) => `${produto.descricao} ${produto.categoria ?? ''}`,
  },
  { id: 'unidade', titulo: 'Unid.', className: 'w-16', valor: (produto) => produto.unidade },
  {
    id: 'venda',
    titulo: 'Preço de venda',
    className: 'text-right whitespace-nowrap',
    valor: (produto) => formatarMoeda(produto.precos.venda),
  },
  { id: 'estoque', titulo: 'Estoque', className: 'whitespace-nowrap' },
  {
    id: 'codigo_barras',
    titulo: 'Código de barras',
    className: 'font-mono text-xs text-muted-foreground',
    ocultaPorPadrao: true,
    valor: (produto) => produto.codigo_barras ?? '—',
    busca: (produto) => produto.codigo_barras,
  },
  {
    id: 'ncm',
    titulo: 'NCM',
    className: 'font-mono text-xs text-muted-foreground',
    ocultaPorPadrao: true,
    valor: (produto) => (produto.fiscal.ncm ? formatarNcm(produto.fiscal.ncm) : '—'),
  },
  { id: 'situacao', titulo: 'Situação' },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-24 text-right whitespace-nowrap' },
]

const situacoes = [
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'inativo', rotulo: 'Inativos' },
] as const

const produtos = useProdutos()
const remover = useRemoverProduto()
const cadastrando = ref(false)
const emEdicao = ref<Produto | null>(null)
const excluindo = ref<Produto | null>(null)
const filtroDeCategoria = useSelecao<string>()
const filtroDeSituacao = useSelecao<'ativo' | 'inativo'>()
const filtroDeEstoque = useSelecao<'baixo'>()

const categorias = computed(
  () =>
    [
      ...new Set(
        produtos.data.value?.map((produto) => produto.categoria).filter((categoria) => !!categoria),
      ),
    ].sort() as string[],
)

const filtrados = computed(() =>
  produtos.data.value?.filter(
    (produto) =>
      (!filtroDeCategoria.selecionados.value.length ||
        filtroDeCategoria.selecionados.value.includes(produto.categoria ?? '')) &&
      (!filtroDeSituacao.selecionados.value.length ||
        filtroDeSituacao.selecionados.value.includes(produto.ativo ? 'ativo' : 'inativo')) &&
      (!filtroDeEstoque.selecionados.value.length || produto.estoque.abaixo_do_minimo),
  ),
)

const filtrosAtivos = computed(
  () =>
    filtroDeCategoria.selecionados.value.length +
    filtroDeSituacao.selecionados.value.length +
    filtroDeEstoque.selecionados.value.length,
)

function limparFiltros() {
  filtroDeCategoria.limpar()
  filtroDeSituacao.limpar()
  filtroDeEstoque.limpar()
}

function excluir() {
  const produto = excluindo.value
  if (!produto) return
  remover.mutate(produto.id, {
    onSuccess: () => {
      toast.success(`Produto ${produto.descricao} excluído.`)
      excluindo.value = null
    },
    onError: () => toast.error('Não foi possível excluir o produto.'),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Produtos</h1>
        <p class="text-muted-foreground">
          Produtos à venda, com preços, estoque e os dados fiscais da NF-e.
        </p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Novo produto
      </Button>
    </div>

    <Listagem
      chave="cadastros-produtos"
      :itens="filtrados"
      :carregando="produtos.isPending.value"
      :erro="produtos.isError.value"
      :colunas="colunas"
      :identificador="(produto) => produto.id"
      placeholder="Buscar por código, descrição, código de barras ou categoria…"
      :filtros-ativos="filtrosAtivos"
      :destacar="(produto) => (produto.ativo ? undefined : 'opacity-60')"
      :vazio="{
        titulo: 'Nenhum produto',
        descricao: 'Cadastre o primeiro em “Novo produto”.',
        icone: Package,
      }"
      @limpar-filtros="limparFiltros"
    >
      <template #filtros>
        <DropdownMenuLabel class="text-xs text-muted-foreground">Estoque</DropdownMenuLabel>
        <ItemDeFiltro
          :marcado="filtroDeEstoque.selecionados.value.includes('baixo')"
          @alternar="(marcado) => filtroDeEstoque.alternar('baixo', marcado)"
        >
          No mínimo ou abaixo
        </ItemDeFiltro>
        <DropdownMenuSeparator />
        <DropdownMenuLabel class="text-xs text-muted-foreground">Situação</DropdownMenuLabel>
        <ItemDeFiltro
          v-for="situacao in situacoes"
          :key="situacao.valor"
          :marcado="filtroDeSituacao.selecionados.value.includes(situacao.valor)"
          @alternar="(marcado) => filtroDeSituacao.alternar(situacao.valor, marcado)"
        >
          {{ situacao.rotulo }}
        </ItemDeFiltro>
        <template v-if="categorias.length">
          <DropdownMenuSeparator />
          <DropdownMenuLabel class="text-xs text-muted-foreground">Categoria</DropdownMenuLabel>
          <div class="max-h-60 overflow-y-auto">
            <ItemDeFiltro
              v-for="categoria in categorias"
              :key="categoria"
              :marcado="filtroDeCategoria.selecionados.value.includes(categoria)"
              @alternar="(marcado) => filtroDeCategoria.alternar(categoria, marcado)"
            >
              {{ categoria }}
            </ItemDeFiltro>
          </div>
        </template>
      </template>
      <template #coluna-descricao="{ item }">
        <div class="flex flex-col">
          <span>{{ item.descricao }}</span>
          <span v-if="item.categoria" class="text-xs font-normal text-muted-foreground">
            {{ item.categoria }}
          </span>
        </div>
      </template>
      <template #coluna-estoque="{ item }">
        <Badge v-if="!item.estoque.controla" variant="outline">Sem controle</Badge>
        <div v-else class="flex items-center gap-2">
          <span :class="Number(item.estoque.atual) < 0 ? 'text-destructive' : undefined">
            {{ formatarQuantidade(item.estoque.atual) }} {{ item.unidade }}
          </span>
          <Badge v-if="item.estoque.abaixo_do_minimo" variant="destructive">Estoque baixo</Badge>
        </div>
      </template>
      <template #coluna-situacao="{ item }">
        <Badge v-if="item.ativo" variant="secondary">Ativo</Badge>
        <Badge v-else variant="outline">Inativo</Badge>
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
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`Excluir ${item.descricao}`"
          @click="excluindo = item"
        >
          <Trash2 />
        </Button>
      </template>
    </Listagem>

    <FormularioDeProduto v-if="cadastrando" @fechar="cadastrando = false" />
    <FormularioDeProduto v-if="emEdicao" :produto="emEdicao" @fechar="emEdicao = null" />
    <DialogoDeConfirmacao
      :aberto="excluindo !== null"
      titulo="Excluir produto"
      rotulo-do-botao="Excluir"
      :processando="remover.isPending.value"
      @confirmar="excluir"
      @fechar="excluindo = null"
    >
      {{ excluindo?.descricao }} sai do cadastro de produtos. Esta ação não pode ser desfeita; para
      só deixar de vender o produto, prefira marcá-lo como inativo.
    </DialogoDeConfirmacao>
  </div>
</template>
