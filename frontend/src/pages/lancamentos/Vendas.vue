<script setup lang="ts">
import { Ban, Eye, Plus, ShoppingCart } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import DialogoDeConfirmacao from '@/components/DialogoDeConfirmacao.vue'
import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { errosDosCampos } from '@/lib/empresas'
import {
  FORMAS_DE_PAGAMENTO,
  formatarData,
  numeroDaVenda,
  useCancelarVenda,
  useVendas,
  type Situacao,
  type Venda,
} from '@/lib/lancamentos-vendas'
import { useSelecao, type Coluna } from '@/lib/listagem'
import { formatarMoeda } from '@/lib/numeros'
import DetalhesDaVenda from '@/pages/lancamentos/vendas/DetalhesDaVenda.vue'
import FormularioDeVenda from '@/pages/lancamentos/vendas/FormularioDeVenda.vue'

const colunas: Coluna<Venda>[] = [
  {
    id: 'numero',
    titulo: 'Nº',
    className: 'w-24 font-mono text-xs',
    valor: (venda) => numeroDaVenda(venda.id),
    busca: (venda) => numeroDaVenda(venda.id),
  },
  {
    id: 'data',
    titulo: 'Data',
    className: 'w-28 whitespace-nowrap',
    valor: (venda) => formatarData(venda.data),
    busca: (venda) => formatarData(venda.data),
  },
  {
    id: 'cliente',
    titulo: 'Cliente',
    className: 'font-medium',
    valor: (venda) => venda.cliente.nome,
    busca: (venda) => `${venda.cliente.nome} ${venda.cliente.cpf_cnpj}`,
  },
  {
    id: 'vendedor',
    titulo: 'Vendedor',
    className: 'text-muted-foreground',
    valor: (venda) => venda.vendedor.nome,
    busca: (venda) => venda.vendedor.nome,
  },
  {
    id: 'pagamento',
    titulo: 'Pagamento',
    className: 'text-muted-foreground whitespace-nowrap',
    valor: (venda) => FORMAS_DE_PAGAMENTO[venda.forma_pagamento] ?? venda.forma_pagamento,
  },
  {
    id: 'itens',
    titulo: 'Itens',
    className: 'w-16 text-right',
    ocultaPorPadrao: true,
    valor: (venda) => venda.itens.length,
  },
  {
    id: 'total',
    titulo: 'Total',
    className: 'text-right whitespace-nowrap',
    valor: (venda) => formatarMoeda(venda.total),
  },
  { id: 'situacao', titulo: 'Situação' },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-24 text-right whitespace-nowrap' },
]

const situacoes: { valor: Situacao; rotulo: string }[] = [
  { valor: 'finalizada', rotulo: 'Finalizadas' },
  { valor: 'cancelada', rotulo: 'Canceladas' },
]

const vendas = useVendas()
const cancelar = useCancelarVenda()
const registrando = ref(false)
const consultando = ref<Venda | null>(null)
const cancelando = ref<Venda | null>(null)
const filtroDeSituacao = useSelecao<Situacao>()
const filtroDePagamento = useSelecao<string>()
const filtroDeVendedor = useSelecao<string>()

const vendedores = computed(
  () => [...new Set(vendas.data.value?.map((venda) => venda.vendedor.nome))].sort() as string[],
)

const filtradas = computed(() =>
  vendas.data.value?.filter(
    (venda) =>
      (!filtroDeSituacao.selecionados.value.length ||
        filtroDeSituacao.selecionados.value.includes(venda.situacao)) &&
      (!filtroDePagamento.selecionados.value.length ||
        filtroDePagamento.selecionados.value.includes(venda.forma_pagamento)) &&
      (!filtroDeVendedor.selecionados.value.length ||
        filtroDeVendedor.selecionados.value.includes(venda.vendedor.nome)),
  ),
)

/** Soma das vendas finalizadas que a listagem mostra (respeita os filtros, não a busca). */
const totalVendido = computed(() =>
  (filtradas.value ?? [])
    .filter((venda) => venda.situacao === 'finalizada')
    .reduce((soma, venda) => soma + Number(venda.total), 0),
)

function limparFiltros() {
  filtroDeSituacao.limpar()
  filtroDePagamento.limpar()
  filtroDeVendedor.limpar()
}

function confirmarCancelamento() {
  const venda = cancelando.value
  if (!venda) return
  cancelar.mutate(venda.id, {
    onSuccess: () => {
      toast.success(`Venda nº ${numeroDaVenda(venda.id)} cancelada. Os itens voltaram ao estoque.`)
      cancelando.value = null
      consultando.value = null
    },
    onError: (erro) =>
      toast.error(errosDosCampos(erro)?.venda ?? 'Não foi possível cancelar a venda.'),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Vendas</h1>
        <p class="text-muted-foreground">
          Vendas registradas, com baixa no estoque. Uma venda não se altera: se preciso, cancele-a e
          os itens voltam ao estoque.
        </p>
      </div>
      <Button @click="registrando = true">
        <Plus data-icon="inline-start" />
        Nova venda
      </Button>
    </div>

    <p v-if="filtradas?.length" class="-mt-3 text-sm text-muted-foreground">
      Total vendido (finalizadas):
      <span class="font-medium text-foreground" data-testid="total-vendido">
        {{ formatarMoeda(totalVendido) }}
      </span>
    </p>

    <Listagem
      chave="lancamentos-vendas"
      :itens="filtradas"
      :carregando="vendas.isPending.value"
      :erro="vendas.isError.value"
      :colunas="colunas"
      :identificador="(venda) => venda.id"
      placeholder="Buscar por número, data, cliente, CPF/CNPJ ou vendedor…"
      :filtros-ativos="
        filtroDeSituacao.selecionados.value.length +
        filtroDePagamento.selecionados.value.length +
        filtroDeVendedor.selecionados.value.length
      "
      :destacar="(venda) => (venda.situacao === 'cancelada' ? 'opacity-60' : undefined)"
      :vazio="{
        titulo: 'Nenhuma venda',
        descricao: 'Registre a primeira em “Nova venda”.',
        icone: ShoppingCart,
      }"
      @limpar-filtros="limparFiltros"
    >
      <template #filtros>
        <DropdownMenuLabel class="text-xs text-muted-foreground">Situação</DropdownMenuLabel>
        <ItemDeFiltro
          v-for="situacao in situacoes"
          :key="situacao.valor"
          :marcado="filtroDeSituacao.selecionados.value.includes(situacao.valor)"
          @alternar="(marcado) => filtroDeSituacao.alternar(situacao.valor, marcado)"
        >
          {{ situacao.rotulo }}
        </ItemDeFiltro>
        <DropdownMenuSeparator />
        <DropdownMenuLabel class="text-xs text-muted-foreground">Pagamento</DropdownMenuLabel>
        <ItemDeFiltro
          v-for="(rotulo, valor) in FORMAS_DE_PAGAMENTO"
          :key="valor"
          :marcado="filtroDePagamento.selecionados.value.includes(valor)"
          @alternar="(marcado) => filtroDePagamento.alternar(valor, marcado)"
        >
          {{ rotulo }}
        </ItemDeFiltro>
        <template v-if="vendedores.length">
          <DropdownMenuSeparator />
          <DropdownMenuLabel class="text-xs text-muted-foreground">Vendedor</DropdownMenuLabel>
          <div class="max-h-60 overflow-y-auto">
            <ItemDeFiltro
              v-for="vendedor in vendedores"
              :key="vendedor"
              :marcado="filtroDeVendedor.selecionados.value.includes(vendedor)"
              @alternar="(marcado) => filtroDeVendedor.alternar(vendedor, marcado)"
            >
              {{ vendedor }}
            </ItemDeFiltro>
          </div>
        </template>
      </template>
      <template #coluna-situacao="{ item }">
        <Badge v-if="item.situacao === 'cancelada'" variant="outline">Cancelada</Badge>
        <Badge v-else variant="secondary">Finalizada</Badge>
      </template>
      <template #coluna-acoes="{ item }">
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`Ver a venda ${numeroDaVenda(item.id)}`"
          @click="consultando = item"
        >
          <Eye />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :disabled="item.situacao === 'cancelada'"
          :aria-label="`Cancelar a venda ${numeroDaVenda(item.id)}`"
          @click="cancelando = item"
        >
          <Ban />
        </Button>
      </template>
    </Listagem>

    <FormularioDeVenda v-if="registrando" @fechar="registrando = false" />
    <DetalhesDaVenda
      v-if="consultando"
      :venda="consultando"
      @fechar="consultando = null"
      @cancelar="cancelando = consultando"
    />
    <DialogoDeConfirmacao
      :aberto="cancelando !== null"
      titulo="Cancelar venda"
      rotulo-do-botao="Cancelar venda"
      :processando="cancelar.isPending.value"
      @confirmar="confirmarCancelamento"
      @fechar="cancelando = null"
    >
      A venda nº {{ cancelando ? numeroDaVenda(cancelando.id) : '' }} fica cancelada e os produtos
      voltam ao estoque. O cancelamento não pode ser desfeito.
    </DialogoDeConfirmacao>
  </div>
</template>
