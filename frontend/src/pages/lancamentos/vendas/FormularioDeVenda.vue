<script setup lang="ts">
import { BriefcaseBusiness, PackageSearch, Trash2, UserRound } from '@lucide/vue'
import { ComboboxInput } from 'reka-ui'
import { computed, nextTick, ref, watch } from 'vue'
import { toast } from 'vue-sonner'

import ConteudoDoFormulario from '@/components/ConteudoDoFormulario.vue'
import Obrigatorio from '@/components/Obrigatorio.vue'
import SeletorComBusca, { type OpcaoDeBusca } from '@/components/SeletorComBusca.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Combobox,
  ComboboxAnchor,
  ComboboxEmpty,
  ComboboxItem,
  ComboboxList,
  ComboboxViewport,
} from '@/components/ui/combobox'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Textarea } from '@/components/ui/textarea'
import { CLASSES_DO_CAMPO_DE_BUSCA, normalizarBusca } from '@/lib/busca'
import { formatarDocumento } from '@/lib/cadastros-clientes'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import {
  numeroDaVenda,
  semEstoque,
  useOpcoesDaVenda,
  useRegistrarVenda,
  type ProdutoParaVenda,
} from '@/lib/lancamentos-vendas'
import { formatarMoeda, formatarQuantidade, lerValor } from '@/lib/numeros'
import { cn } from '@/lib/utils'
import {
  camposDoServidor,
  centavosDoItem,
  esquemaDaVenda,
  novoItem,
  paraApi,
  totaisDaVenda,
  valoresIniciais,
  type ItemDoFormulario,
} from '@/pages/lancamentos/vendas/esquema'

const emit = defineEmits<{ fechar: [] }>()

const opcoes = useOpcoesDaVenda()
const registrar = useRegistrarVenda()

const { campo, errors, values, handleSubmit, setFieldError, setValues, submitCount, validate } =
  useFormulario(esquemaDaVenda, valoresIniciais())
const [data] = campo('data')
const [cliente] = campo('cliente')
const [vendedor] = campo('vendedor')
const [formaDePagamento] = campo('forma_pagamento')
const [desconto] = campo('desconto')
const [observacoes] = campo('observacoes')

// Cliente (por nome ou CPF/CNPJ) e vendedor, escolhidos pela busca.
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

// Produto: busca por código, descrição ou código de barras (o leitor digita o código e um Enter).
const buscaDeProduto = ref('')
// Volta a vazio depois de cada escolha, para o mesmo produto poder ser escolhido de novo. Só no
// próximo tick: antes disso o Combobox não chega a ver a escolha e a desfaria na seguinte.
const produtoEscolhido = ref<number>()
watch(produtoEscolhido, (id) => {
  if (id === undefined) return
  adicionar(id)
  nextTick(() => (produtoEscolhido.value = undefined))
})
const produtosEncontrados = computed(() => {
  const termo = normalizarBusca(buscaDeProduto.value)
  return (opcoes.data.value?.produtos ?? [])
    .filter(
      (produto) =>
        normalizarBusca(`${produto.codigo} ${produto.descricao}`).includes(termo) ||
        (termo !== '' && produto.codigo_barras?.startsWith(termo)),
    )
    .slice(0, 50)
})

const itens = computed(() => values.itens ?? [])
const totais = computed(() =>
  totaisDaVenda({ itens: itens.value, desconto: values.desconto ?? '' }),
)

/** Produto escolhido na busca: entra com 1 unidade ou soma 1 ao item que já está na venda. */
function adicionar(id: number) {
  const produto = opcoes.data.value?.produtos.find((opcao) => opcao.id === id)
  if (!produto || semEstoque(produto)) return
  const indice = itens.value.findIndex((item) => item.produto === produto.id)
  if (indice === -1) {
    definirItens([...itens.value, novoItem(produto)])
    return
  }
  const quantidade = lerValor(itens.value[indice].quantidade, { casas: 3 })
  if (quantidade !== null && !Number.isNaN(quantidade)) {
    alterar(indice, 'quantidade', formatarQuantidade(quantidade + 1).replace(/\./g, ''))
  }
}

/**
 * Troca a lista de itens. Pelo `setValues`, e não pelo `setFieldValue`: este registraria `itens`
 * como campo, e o vee-validate passaria a juntar nele os erros de cada item (`itens[0].quantidade`).
 */
function definirItens(lista: ItemDoFormulario[]) {
  setValues({ itens: lista }, false)
}

function alterar(
  indice: number,
  chave: 'quantidade' | 'preco_unitario' | 'desconto',
  valor: string,
) {
  definirItens(
    itens.value.map((item, posicao) => (posicao === indice ? { ...item, [chave]: valor } : item)),
  )
}

function retirar(indice: number) {
  definirItens(itens.value.filter((_, posicao) => posicao !== indice))
}

// Depois da primeira tentativa de registrar, os erros acompanham as mudanças (inclusive nos itens,
// que não são campos do `campo()`).
watch(
  () => values.itens,
  () => {
    if (submitCount.value > 0) validate()
  },
  { deep: true },
)

const salvar = handleSubmit((dados) => {
  registrar.mutate(paraApi(dados), {
    onSuccess: (venda) => {
      toast.success(`Venda nº ${numeroDaVenda(venda.id)} registrada.`)
      emit('fechar')
    },
    onError: (erro: unknown) => {
      mostrarErrosDoServidor(
        erro,
        setFieldError as (campo: string, mensagem: string) => void,
        camposDoServidor(dados.itens.length),
        'Não foi possível registrar a venda.',
      )
      // O saldo pode ter mudado (outra venda no meio do caminho): busca de novo.
      opcoes.refetch()
    },
  })
})

/** O desconto não passa do subtotal: avisa enquanto se digita, sem esperar o envio. */
const avisoDeDesconto = computed(() =>
  itens.value.length && totais.value.total < 0
    ? 'O desconto não pode passar do subtotal.'
    : undefined,
)

/** Atributos de um campo com erro. */
const invalido = (mensagem: string | undefined) => (mensagem ? true : undefined)
// O vee-validate guarda os erros de lista com colchetes: `itens[0].quantidade`.
const erroDoItem = (indice: number, chave: string) =>
  (errors.value as Record<string, string | undefined>)[`itens[${indice}].${chave}`]
const errosDoItem = (indice: number) =>
  (['quantidade', 'preco_unitario', 'desconto'] as const)
    .map((chave) => erroDoItem(indice, chave))
    .filter((mensagem): mensagem is string => !!mensagem)

const saldo = (item: ItemDoFormulario) =>
  item.controla_estoque
    ? `Disponível: ${formatarQuantidade(item.disponivel)} ${item.unidade}`
    : 'Sem controle de estoque'
const valorDoItem = (item: ItemDoFormulario) => {
  const valor = centavosDoItem(item)
  return valor ? formatarMoeda(valor.total / 100) : '—'
}
const rotuloDoEstoque = (produto: ProdutoParaVenda) =>
  produto.controla_estoque
    ? `${formatarQuantidade(produto.estoque_atual)} ${produto.unidade}`
    : 'Sem controle'
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <ConteudoDoFormulario chave="venda" largura="sm:w-5xl">
      <DialogHeader>
        <DialogTitle>Nova venda</DialogTitle>
        <DialogDescription>
          Os produtos saem do estoque ao registrar. Produto sem estoque não pode ser vendido.
        </DialogDescription>
      </DialogHeader>
      <div v-if="opcoes.isPending.value" class="flex justify-center py-10">
        <Spinner />
      </div>
      <form v-else id="form-venda" novalidate @submit="salvar">
        <FieldGroup class="gap-4">
          <div class="grid gap-4 sm:grid-cols-[11rem_1fr]">
            <Field :data-invalid="invalido(errors.data)">
              <FieldLabel for="venda-data">Data <Obrigatorio /></FieldLabel>
              <Input
                id="venda-data"
                v-model="data"
                type="date"
                :aria-invalid="invalido(errors.data)"
              />
              <FieldError :errors="[errors.data]" />
            </Field>
            <Field :data-invalid="invalido(errors.cliente)">
              <FieldLabel for="venda-cliente">Cliente <Obrigatorio /></FieldLabel>
              <SeletorComBusca
                id="venda-cliente"
                v-model="cliente"
                :opcoes="clientes"
                placeholder="Buscar por nome ou CPF/CNPJ…"
                vazio="Nenhum cliente ativo encontrado."
                :icone="UserRound"
                :invalido="!!errors.cliente"
              />
              <FieldError :errors="[errors.cliente]" />
            </Field>
          </div>
          <div class="grid gap-4 sm:grid-cols-2">
            <Field :data-invalid="invalido(errors.vendedor)">
              <FieldLabel for="venda-vendedor">Vendedor <Obrigatorio /></FieldLabel>
              <SeletorComBusca
                id="venda-vendedor"
                v-model="vendedor"
                :opcoes="vendedores"
                placeholder="Buscar pelo nome…"
                vazio="Nenhum vendedor ativo encontrado."
                :icone="BriefcaseBusiness"
                :invalido="!!errors.vendedor"
              />
              <FieldError :errors="[errors.vendedor]" />
            </Field>
            <Field :data-invalid="invalido(errors.forma_pagamento)">
              <FieldLabel for="venda-pagamento">Forma de pagamento <Obrigatorio /></FieldLabel>
              <Select v-model="formaDePagamento">
                <SelectTrigger
                  id="venda-pagamento"
                  class="w-full"
                  :aria-invalid="invalido(errors.forma_pagamento)"
                >
                  <SelectValue placeholder="Escolha" />
                </SelectTrigger>
                <SelectContent>
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

          <Field :data-invalid="invalido(errors.itens)">
            <FieldLabel for="venda-produto">Produtos <Obrigatorio /></FieldLabel>
            <Combobox v-model="produtoEscolhido" ignore-filter open-on-click>
              <ComboboxAnchor class="relative w-full">
                <PackageSearch
                  class="pointer-events-none absolute top-2.5 left-3 size-4 text-muted-foreground"
                />
                <ComboboxInput
                  id="venda-produto"
                  v-model="buscaDeProduto"
                  placeholder="Buscar por código, descrição ou código de barras…"
                  autocomplete="off"
                  :class="CLASSES_DO_CAMPO_DE_BUSCA"
                  :aria-invalid="invalido(errors.itens)"
                />
              </ComboboxAnchor>
              <ComboboxList class="w-(--reka-combobox-trigger-width)" align="start">
                <ComboboxViewport class="p-1">
                  <ComboboxEmpty>Nenhum produto ativo encontrado.</ComboboxEmpty>
                  <ComboboxItem
                    v-for="produto in produtosEncontrados"
                    :key="produto.id"
                    :value="produto.id"
                    :disabled="semEstoque(produto)"
                  >
                    <div class="flex min-w-0 flex-col">
                      <span class="truncate">{{ produto.descricao }}</span>
                      <span class="font-mono text-xs text-muted-foreground">
                        {{ produto.codigo }}
                      </span>
                    </div>
                    <div class="ml-auto flex shrink-0 items-center gap-2">
                      <span class="text-muted-foreground">
                        {{ formatarMoeda(produto.preco_venda) }}
                      </span>
                      <Badge v-if="semEstoque(produto)" variant="destructive">Sem estoque</Badge>
                      <Badge v-else variant="outline">{{ rotuloDoEstoque(produto) }}</Badge>
                    </div>
                  </ComboboxItem>
                </ComboboxViewport>
              </ComboboxList>
            </Combobox>
            <FieldError :errors="[errors.itens]" />
          </Field>

          <div v-if="itens.length" class="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead class="w-28">Quantidade</TableHead>
                  <TableHead class="w-32">Preço unit.</TableHead>
                  <TableHead class="w-28">Desconto</TableHead>
                  <TableHead class="w-28 text-right">Total</TableHead>
                  <TableHead class="w-12"><span class="sr-only">Ações</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <template v-for="(item, indice) in itens" :key="item.produto">
                  <TableRow class="align-top">
                    <TableCell class="whitespace-normal">
                      <div class="flex flex-col">
                        <span class="font-medium">{{ item.descricao }}</span>
                        <span class="text-xs text-muted-foreground">
                          <span class="font-mono">{{ item.codigo }}</span> · {{ saldo(item) }}
                        </span>
                        <span v-if="erroDoItem(indice, 'produto')" class="text-xs text-destructive">
                          {{ erroDoItem(indice, 'produto') }}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        :model-value="item.quantidade"
                        inputmode="decimal"
                        class="h-8"
                        :aria-label="`Quantidade de ${item.descricao}`"
                        :aria-invalid="invalido(erroDoItem(indice, 'quantidade'))"
                        @update:model-value="
                          (valor) => alterar(indice, 'quantidade', String(valor))
                        "
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        :model-value="item.preco_unitario"
                        inputmode="decimal"
                        class="h-8"
                        :aria-label="`Preço de ${item.descricao}`"
                        :aria-invalid="invalido(erroDoItem(indice, 'preco_unitario'))"
                        @update:model-value="
                          (valor) => alterar(indice, 'preco_unitario', String(valor))
                        "
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        :model-value="item.desconto"
                        inputmode="decimal"
                        placeholder="0,00"
                        class="h-8"
                        :aria-label="`Desconto de ${item.descricao}`"
                        :aria-invalid="invalido(erroDoItem(indice, 'desconto'))"
                        @update:model-value="(valor) => alterar(indice, 'desconto', String(valor))"
                      />
                    </TableCell>
                    <TableCell class="pt-3.5 text-right font-medium whitespace-nowrap">
                      {{ valorDoItem(item) }}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        class="size-8"
                        :aria-label="`Retirar ${item.descricao}`"
                        @click="retirar(indice)"
                      >
                        <Trash2 />
                      </Button>
                    </TableCell>
                  </TableRow>
                  <TableRow v-if="errosDoItem(indice).length" class="hover:bg-transparent">
                    <TableCell colspan="6" class="pt-0 text-xs whitespace-normal text-destructive">
                      <p v-for="mensagem in errosDoItem(indice)" :key="mensagem">{{ mensagem }}</p>
                    </TableCell>
                  </TableRow>
                </template>
              </TableBody>
            </Table>
          </div>

          <div class="grid gap-4 sm:grid-cols-[1fr_16rem]">
            <Field :data-invalid="invalido(errors.observacoes)">
              <FieldLabel for="venda-observacoes">Observações</FieldLabel>
              <Textarea
                id="venda-observacoes"
                v-model="observacoes"
                rows="4"
                maxlength="5000"
                :aria-invalid="invalido(errors.observacoes)"
              />
              <FieldError :errors="[errors.observacoes]" />
            </Field>
            <div class="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Subtotal</span>
                <span data-testid="venda-subtotal">{{ formatarMoeda(totais.subtotal / 100) }}</span>
              </div>
              <Field :data-invalid="invalido(errors.desconto)" class="gap-1">
                <div class="flex items-center justify-between gap-2">
                  <FieldLabel for="venda-desconto" class="font-normal text-muted-foreground">
                    Desconto (R$)
                  </FieldLabel>
                  <Input
                    id="venda-desconto"
                    v-model="desconto"
                    inputmode="decimal"
                    placeholder="0,00"
                    class="h-8 w-28 text-right"
                    :aria-invalid="invalido(errors.desconto)"
                  />
                </div>
                <FieldError :errors="[errors.desconto ?? avisoDeDesconto]" />
              </Field>
              <div
                :class="
                  cn(
                    'flex justify-between border-t pt-2 text-base font-semibold',
                    totais.total < 0 && 'text-destructive',
                  )
                "
              >
                <span>Total</span>
                <span data-testid="venda-total">{{ formatarMoeda(totais.total / 100) }}</span>
              </div>
            </div>
          </div>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="form-venda" :disabled="registrar.isPending.value">
          <Spinner v-if="registrar.isPending.value" data-icon="inline-start" />
          Registrar venda
        </Button>
      </DialogFooter>
    </ConteudoDoFormulario>
  </Dialog>
</template>
