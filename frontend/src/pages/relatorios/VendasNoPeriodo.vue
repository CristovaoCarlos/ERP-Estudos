<script setup lang="ts">
import { BriefcaseBusiness, FileDown, FileSearch, Receipt, UserRound } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import Listagem from '@/components/Listagem.vue'
import Obrigatorio from '@/components/Obrigatorio.vue'
import SeletorComBusca, { type OpcaoDeBusca } from '@/components/SeletorComBusca.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatarDocumento } from '@/lib/cadastros-clientes'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import { FORMAS_DE_PAGAMENTO, formatarData, numeroDaVenda } from '@/lib/lancamentos-vendas'
import type { Coluna } from '@/lib/listagem'
import { formatarMoeda } from '@/lib/numeros'
import {
  baixarPdfDoRelatorio,
  FalhaNoPdf,
  useOpcoesDoRelatorio,
  useRelatorioDeVendas,
  type FiltrosDoRelatorio,
  type RelatorioDeVendas,
} from '@/lib/relatorios-vendas'
import {
  CAMPOS,
  esquemaDosFiltros,
  paraFiltros,
  valoresIniciais,
} from '@/pages/relatorios/vendas-periodo/esquema'

type VendaDoRelatorio = RelatorioDeVendas['vendas'][number]

const colunas: Coluna<VendaDoRelatorio>[] = [
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
  { id: 'itens', titulo: 'Itens', className: 'w-16 text-right', valor: (venda) => venda.itens },
  {
    id: 'desconto',
    titulo: 'Desconto',
    className: 'text-right whitespace-nowrap',
    ocultaPorPadrao: true,
    valor: (venda) => (Number(venda.desconto) ? formatarMoeda(venda.desconto) : '—'),
  },
  {
    id: 'total',
    titulo: 'Total',
    className: 'text-right whitespace-nowrap',
    valor: (venda) => formatarMoeda(venda.total),
  },
  { id: 'situacao', titulo: 'Situação' },
]

const opcoes = useOpcoesDoRelatorio()
const aplicados = ref<FiltrosDoRelatorio | null>(null)
const relatorio = useRelatorioDeVendas(aplicados)
const exportando = ref(false)

const { campo, errors, handleSubmit, setFieldError } = useFormulario(
  esquemaDosFiltros,
  valoresIniciais(),
)
const [inicio] = campo('inicio')
const [fim] = campo('fim')
const [vendedor] = campo('vendedor')
const [cliente] = campo('cliente')
const [formaDePagamento] = campo('forma_pagamento')
const [incluirCanceladas] = campo('incluir_canceladas')

const clientes = computed<OpcaoDeBusca[]>(() =>
  (opcoes.data.value?.clientes ?? []).map((opcao) => ({
    valor: String(opcao.id),
    rotulo: opcao.nome,
    detalhe: formatarDocumento(opcao.tipo_pessoa, opcao.cpf_cnpj),
    documento: opcao.cpf_cnpj,
  })),
)
const vendedores = computed<OpcaoDeBusca[]>(() =>
  (opcoes.data.value?.vendedores ?? []).map((opcao) => ({
    valor: String(opcao.id),
    rotulo: opcao.nome,
  })),
)

const gerar = handleSubmit((dados) => {
  aplicados.value = paraFiltros(dados)
})

const exportar = handleSubmit(async (dados) => {
  exportando.value = true
  try {
    await baixarPdfDoRelatorio(paraFiltros(dados))
  } catch (erro) {
    if (erro instanceof FalhaNoPdf) toast.error(erro.message)
    else mostrarErrosDoServidor(erro, setFieldError, [...CAMPOS], 'Não foi possível gerar o PDF.')
  } finally {
    exportando.value = false
  }
})

const resumo = computed(() => relatorio.data.value?.resumo)
const cartoes = computed(() =>
  resumo.value
    ? [
        { rotulo: 'Vendas finalizadas', valor: String(resumo.value.quantidade) },
        { rotulo: 'Soma dos itens', valor: formatarMoeda(resumo.value.subtotal) },
        { rotulo: 'Descontos', valor: formatarMoeda(resumo.value.descontos) },
        { rotulo: 'Total vendido', valor: formatarMoeda(resumo.value.total) },
        { rotulo: 'Ticket médio', valor: formatarMoeda(resumo.value.ticket_medio) },
      ]
    : [],
)
const percentual = (valor: string) => `${Number(valor).toLocaleString('pt-BR')}%`

/** Atributos de um campo com erro. */
const invalido = (mensagem: string | undefined) => (mensagem ? true : undefined)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Vendas no período</h1>
      <p class="text-muted-foreground">
        Totais das vendas finalizadas por forma de pagamento e por vendedor, com a lista das vendas.
        Exporte em PDF para imprimir ou enviar.
      </p>
    </div>

    <form
      class="flex flex-col gap-4 rounded-lg border p-4"
      aria-label="Filtros do relatório"
      novalidate
      @submit="gerar"
    >
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-[10rem_10rem_1fr_1fr_12rem]">
        <Field :data-invalid="invalido(errors.inicio)">
          <FieldLabel for="relatorio-inicio">Data inicial <Obrigatorio /></FieldLabel>
          <Input
            id="relatorio-inicio"
            v-model="inicio"
            type="date"
            :aria-invalid="invalido(errors.inicio)"
          />
          <FieldError :errors="[errors.inicio]" />
        </Field>
        <Field :data-invalid="invalido(errors.fim)">
          <FieldLabel for="relatorio-fim">Data final <Obrigatorio /></FieldLabel>
          <Input
            id="relatorio-fim"
            v-model="fim"
            type="date"
            :aria-invalid="invalido(errors.fim)"
          />
          <FieldError :errors="[errors.fim]" />
        </Field>
        <Field :data-invalid="invalido(errors.vendedor)">
          <FieldLabel for="relatorio-vendedor">Vendedor</FieldLabel>
          <SeletorComBusca
            id="relatorio-vendedor"
            v-model="vendedor"
            :opcoes="vendedores"
            placeholder="Todos"
            vazio="Nenhum vendedor encontrado."
            :icone="BriefcaseBusiness"
            :invalido="!!errors.vendedor"
          />
          <FieldError :errors="[errors.vendedor]" />
        </Field>
        <Field :data-invalid="invalido(errors.cliente)">
          <FieldLabel for="relatorio-cliente">Cliente</FieldLabel>
          <SeletorComBusca
            id="relatorio-cliente"
            v-model="cliente"
            :opcoes="clientes"
            placeholder="Todos"
            vazio="Nenhum cliente encontrado."
            :icone="UserRound"
            :invalido="!!errors.cliente"
          />
          <FieldError :errors="[errors.cliente]" />
        </Field>
        <Field :data-invalid="invalido(errors.forma_pagamento)">
          <FieldLabel for="relatorio-pagamento">Pagamento</FieldLabel>
          <Select
            :model-value="formaDePagamento || 'todas'"
            @update:model-value="
              (valor) => (formaDePagamento = valor === 'todas' ? '' : String(valor))
            "
          >
            <SelectTrigger id="relatorio-pagamento" class="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas</SelectItem>
              <SelectItem
                v-for="opcao in opcoes.data.value?.formas_de_pagamento"
                :key="opcao.valor"
                :value="opcao.valor"
              >
                {{ opcao.descricao }}
              </SelectItem>
            </SelectContent>
          </Select>
          <FieldError :errors="[errors.forma_pagamento]" />
        </Field>
      </div>
      <div class="flex flex-wrap items-center justify-between gap-4">
        <label class="flex items-center gap-2 text-sm">
          <Checkbox
            :model-value="incluirCanceladas"
            @update:model-value="(marcado) => (incluirCanceladas = marcado === true)"
          />
          Listar também as canceladas
          <span class="text-muted-foreground">(ficam fora dos totais)</span>
        </label>
        <div class="flex gap-2">
          <Button type="button" variant="outline" :disabled="exportando" @click="exportar">
            <Spinner v-if="exportando" data-icon="inline-start" />
            <FileDown v-else data-icon="inline-start" />
            {{ exportando ? 'Gerando PDF…' : 'Exportar PDF' }}
          </Button>
          <Button type="submit">
            <FileSearch data-icon="inline-start" />
            Gerar
          </Button>
        </div>
      </div>
    </form>

    <p
      v-if="!aplicados"
      class="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground"
    >
      Escolha o período e clique em <strong>Gerar</strong> para ver o relatório, ou em
      <strong>Exportar PDF</strong> para baixá-lo direto.
    </p>
    <div v-else-if="relatorio.isPending.value" class="grid gap-3 sm:grid-cols-5">
      <Skeleton v-for="indice in 5" :key="indice" class="h-20" />
    </div>
    <p v-else-if="relatorio.isError.value" class="text-sm text-destructive">
      Não foi possível gerar o relatório.
    </p>
    <template v-else-if="relatorio.data.value">
      <section aria-label="Resumo" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div v-for="cartao in cartoes" :key="cartao.rotulo" class="rounded-lg border p-4">
          <p class="text-sm text-muted-foreground">{{ cartao.rotulo }}</p>
          <p class="text-2xl font-semibold tracking-tight">{{ cartao.valor }}</p>
        </div>
      </section>
      <p v-if="resumo?.canceladas.quantidade" class="-mt-3 text-sm text-muted-foreground">
        {{ resumo.canceladas.quantidade }} venda(s) cancelada(s) no período, somando
        {{ formatarMoeda(resumo.canceladas.total) }}, fora dos totais.
      </p>

      <div class="grid gap-6 lg:grid-cols-2">
        <section class="flex flex-col gap-2" aria-labelledby="relatorio-por-pagamento">
          <h2 id="relatorio-por-pagamento" class="font-semibold">Por forma de pagamento</h2>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Forma de pagamento</TableHead>
                  <TableHead class="text-right">Vendas</TableHead>
                  <TableHead class="text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow
                  v-for="linha in relatorio.data.value.por_pagamento"
                  :key="linha.forma_pagamento"
                >
                  <TableCell>{{ linha.descricao }}</TableCell>
                  <TableCell class="text-right">{{ linha.quantidade }}</TableCell>
                  <TableCell class="text-right">{{ formatarMoeda(linha.total) }}</TableCell>
                </TableRow>
                <TableRow v-if="!relatorio.data.value.por_pagamento.length">
                  <TableCell colspan="3" class="text-muted-foreground">Nenhuma venda.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
        <section class="flex flex-col gap-2" aria-labelledby="relatorio-por-vendedor">
          <h2 id="relatorio-por-vendedor" class="font-semibold">Por vendedor</h2>
          <div class="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendedor</TableHead>
                  <TableHead class="text-right">Vendas</TableHead>
                  <TableHead class="text-right">Total</TableHead>
                  <TableHead class="text-right">Comissão estimada</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow v-for="linha in relatorio.data.value.por_vendedor" :key="linha.id">
                  <TableCell>{{ linha.nome }}</TableCell>
                  <TableCell class="text-right">{{ linha.quantidade }}</TableCell>
                  <TableCell class="text-right">{{ formatarMoeda(linha.total) }}</TableCell>
                  <TableCell class="text-right whitespace-nowrap">
                    {{ formatarMoeda(linha.comissao) }}
                    <span class="text-xs text-muted-foreground">
                      ({{ percentual(linha.comissao_percentual) }})
                    </span>
                  </TableCell>
                </TableRow>
                <TableRow v-if="!relatorio.data.value.por_vendedor.length">
                  <TableCell colspan="4" class="text-muted-foreground">Nenhuma venda.</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </section>
      </div>

      <section class="flex flex-col gap-2">
        <h2 class="font-semibold">Vendas</h2>
        <Listagem
          chave="relatorios-vendas-periodo"
          :itens="relatorio.data.value.vendas"
          :carregando="false"
          :erro="false"
          :colunas="colunas"
          :identificador="(venda) => venda.id"
          placeholder="Buscar por número, data, cliente ou vendedor…"
          :filtros-ativos="0"
          :destacar="(venda) => (venda.situacao === 'cancelada' ? 'opacity-60' : undefined)"
          :vazio="{
            titulo: 'Nenhuma venda no período',
            descricao: 'Mude o período ou os filtros e gere de novo.',
            icone: Receipt,
          }"
        >
          <template #filtros>
            <p class="px-2 py-1.5 text-sm text-muted-foreground">
              Os filtros do relatório ficam acima; gere de novo para aplicá-los.
            </p>
          </template>
          <template #coluna-situacao="{ item }">
            <Badge v-if="item.situacao === 'cancelada'" variant="outline">Cancelada</Badge>
            <Badge v-else variant="secondary">Finalizada</Badge>
          </template>
        </Listagem>
      </section>
    </template>
  </div>
</template>
