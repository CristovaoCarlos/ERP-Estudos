<script setup lang="ts" generic="T">
import { Columns3, Filter, Search, X } from '@lucide/vue'
import { computed, ref } from 'vue'

import Paginacao from '@/components/Paginacao.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { Coluna, ListagemVazia } from '@/lib/listagem'

/**
 * Listagem padrão do sistema: busca rápida à esquerda, filtros e colunas à direita, e a tabela
 * abaixo. Toda tela de listagem deve usar este componente.
 *
 * Slots: `#coluna-<id>="{ item }"` (conteúdo da célula), `#filtros` (menu Filtros) e `#acoes`
 * (controles entre a busca e os filtros).
 */
const props = withDefaults(
  defineProps<{
    /** Identifica a tela para lembrar as colunas escolhidas. */
    chave: string
    itens: T[] | undefined
    carregando: boolean
    erro?: boolean
    colunas: Coluna<T>[]
    identificador: (item: T) => string | number
    placeholder?: string
    filtrosAtivos?: number
    vazio?: ListagemVazia
    /** Classes da linha (ex.: esmaecer inativos). */
    destacar?: (item: T) => string | undefined
  }>(),
  { erro: false, placeholder: 'Buscar…', filtrosAtivos: 0, vazio: undefined, destacar: undefined },
)
const emit = defineEmits<{ limparFiltros: [] }>()
defineSlots<
  {
    filtros?: () => unknown
    acoes?: () => unknown
  } & Record<`coluna-${string}`, (contexto: { item: T }) => unknown>
>()

const POR_PAGINA_INICIAL = 15
const busca = ref('')
const pagina = ref(1)
const porPagina = ref(POR_PAGINA_INICIAL)

/** Colunas escondidas ficam lembradas no navegador, por tela. */
const armazenamento = `erp_estudos.colunas.${props.chave}`
const escondidas = ref<string[]>(colunasEscondidasSalvas())

function colunasEscondidasSalvas(): string[] {
  try {
    const salvo = localStorage.getItem(armazenamento)
    if (salvo) return JSON.parse(salvo) as string[]
  } catch {
    // Navegador sem acesso ao armazenamento: usa o padrão da tela.
  }
  return props.colunas.filter((coluna) => coluna.ocultaPorPadrao).map((coluna) => coluna.id)
}

function alternar(id: string) {
  escondidas.value = escondidas.value.includes(id)
    ? escondidas.value.filter((atual) => atual !== id)
    : [...escondidas.value, id]
  try {
    localStorage.setItem(armazenamento, JSON.stringify(escondidas.value))
  } catch {
    // Sem armazenamento, a escolha vale só nesta visita.
  }
}

const visiveis = computed(() =>
  props.colunas.filter((coluna) => !escondidas.value.includes(coluna.id)),
)

const filtrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()
  if (!termo || !props.itens) return props.itens
  return props.itens.filter((item) =>
    props.colunas.some((coluna) => coluna.busca?.(item)?.toLowerCase().includes(termo)),
  )
})

const total = computed(() => filtrados.value?.length ?? 0)
const paginas = computed(() => Math.max(1, Math.ceil(total.value / porPagina.value)))
// Busca ou filtro novo pode encurtar a lista: a página nunca passa da última.
const paginaAtual = computed(() => Math.min(pagina.value, paginas.value))
const daPagina = computed(() =>
  filtrados.value?.slice(
    (paginaAtual.value - 1) * porPagina.value,
    paginaAtual.value * porPagina.value,
  ),
)

function buscar(valor: string | number) {
  busca.value = String(valor)
  pagina.value = 1
}

function mudarPorPagina(quantidade: number) {
  porPagina.value = quantidade
  pagina.value = 1
}
</script>

<template>
  <div class="flex flex-col gap-4">
    <div
      class="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3"
    >
      <InputGroup class="w-full bg-background sm:w-80">
        <InputGroupAddon>
          <Search class="size-4 text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput
          aria-label="Busca rápida"
          :placeholder="placeholder"
          :model-value="busca"
          @update:model-value="buscar"
        />
      </InputGroup>

      <div class="ml-auto flex flex-wrap items-center gap-2">
        <slot name="acoes" />

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Filter />
              Filtros
              <Badge v-if="filtrosAtivos > 0" variant="secondary" class="ml-1">
                {{ filtrosAtivos }}
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-64">
            <DropdownMenuLabel>Filtros</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <slot name="filtros">
              <p class="px-2 py-1.5 text-sm text-muted-foreground">
                Esta tela ainda não tem filtros.
              </p>
            </slot>
            <template v-if="filtrosAtivos > 0">
              <DropdownMenuSeparator />
              <Button
                variant="ghost"
                size="sm"
                class="w-full justify-start"
                @click="emit('limparFiltros')"
              >
                <X />
                Limpar filtros
              </Button>
            </template>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <Button variant="outline" size="sm">
              <Columns3 />
              Colunas
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" class="w-52">
            <DropdownMenuLabel>Colunas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              v-for="coluna in colunas.filter((coluna) => !coluna.fixa)"
              :key="coluna.id"
              :model-value="!escondidas.includes(coluna.id)"
              @update:model-value="alternar(coluna.id)"
              @select="(evento: Event) => evento.preventDefault()"
            >
              {{ coluna.titulo }}
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>

    <Alert v-if="erro" variant="destructive">
      <AlertTitle>Não foi possível carregar a lista</AlertTitle>
      <AlertDescription>Tente novamente em alguns instantes.</AlertDescription>
    </Alert>

    <Empty v-else-if="filtrados?.length === 0" class="border border-dashed">
      <EmptyHeader>
        <template v-if="busca">
          <EmptyMedia variant="icon">
            <Search />
          </EmptyMedia>
          <EmptyTitle>Nada encontrado</EmptyTitle>
          <EmptyDescription>Nenhum resultado para “{{ busca }}”.</EmptyDescription>
        </template>
        <template v-else-if="vazio">
          <EmptyMedia variant="icon">
            <component :is="vazio.icone" />
          </EmptyMedia>
          <EmptyTitle>{{ vazio.titulo }}</EmptyTitle>
          <EmptyDescription>{{ vazio.descricao }}</EmptyDescription>
        </template>
      </EmptyHeader>
    </Empty>

    <div v-else class="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead v-for="coluna in visiveis" :key="coluna.id" :class="coluna.className">
              {{ coluna.titulo }}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <template v-if="carregando">
            <TableRow v-for="linha in 3" :key="linha">
              <TableCell v-for="coluna in visiveis" :key="coluna.id">
                <Skeleton class="h-4 w-full" />
              </TableCell>
            </TableRow>
          </template>
          <template v-else>
            <TableRow v-for="item in daPagina" :key="identificador(item)" :class="destacar?.(item)">
              <TableCell v-for="coluna in visiveis" :key="coluna.id" :class="coluna.className">
                <slot :name="`coluna-${coluna.id}`" :item="item">{{ coluna.valor?.(item) }}</slot>
              </TableCell>
            </TableRow>
          </template>
        </TableBody>
      </Table>
      <Paginacao
        :total="total"
        :pagina="paginaAtual"
        :paginas="paginas"
        :por-pagina="porPagina"
        @mudar-pagina="(nova) => (pagina = nova)"
        @mudar-por-pagina="mudarPorPagina"
      />
    </div>
  </div>
</template>
