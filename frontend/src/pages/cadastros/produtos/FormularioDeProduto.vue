<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import ConteudoDoFormulario from '@/components/ConteudoDoFormulario.vue'
import Obrigatorio from '@/components/Obrigatorio.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  calcularMargem,
  formatarCest,
  formatarNcm,
  useAlterarProduto,
  useCadastrarProduto,
  useOpcoesDeProdutos,
  type Produto,
} from '@/lib/cadastros-produtos'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import { lerValor } from '@/lib/numeros'
import {
  abaDoCampo,
  CAMPOS,
  esquemaDoProduto,
  paraApi,
  valoresIniciais,
  type Aba,
} from '@/pages/cadastros/produtos/esquema'

/** `produto` ausente: cadastro. Presente: alteração. */
const props = defineProps<{ produto?: Produto }>()
const emit = defineEmits<{ fechar: [] }>()

const opcoes = useOpcoesDeProdutos()
const cadastrar = useCadastrarProduto()
const alterar = useAlterarProduto(props.produto?.id ?? 0)
const salvando = computed(() => (props.produto ? alterar : cadastrar).isPending.value)

const { campo, errors, handleSubmit, setFieldError } = useFormulario(
  esquemaDoProduto,
  valoresIniciais(props.produto),
)
const [codigo] = campo('codigo')
const [descricao] = campo('descricao')
const [codigoBarras] = campo('codigo_barras')
const [unidade] = campo('unidade')
const [categoria] = campo('categoria')
const [custo] = campo('precos.custo')
const [venda] = campo('precos.venda')
const [controla] = campo('estoque.controla')
const [estoqueAtual] = campo('estoque.atual')
const [estoqueMinimo] = campo('estoque.minimo')
const [ncm] = campo('fiscal.ncm')
const [cest] = campo('fiscal.cest')
const [origem] = campo('fiscal.origem')
const [pesoBruto] = campo('pesos.bruto')
const [pesoLiquido] = campo('pesos.liquido')
const [observacoes] = campo('observacoes')
const [ativo] = campo('ativo')

/** Margem ao vivo, enquanto os preços são digitados. */
const margem = computed(() =>
  calcularMargem(lerValor(custo.value ?? '', { casas: 4 }), lerValor(venda.value ?? '')),
)
const estoqueNegativo = computed(
  () => (lerValor(estoqueAtual.value ?? '', { casas: 3, negativo: true }) ?? 0) < 0,
)

const aba = ref<Aba>('identificacao')
const abasComErro = computed(
  () => new Set(Object.keys(errors.value).map((campo) => abaDoCampo(campo))),
)
const ORDEM: Aba[] = ['identificacao', 'precos', 'fiscal', 'observacoes']
function abrirPrimeiraAbaComErro(campos: string[]) {
  const abas = new Set(campos.map(abaDoCampo))
  const primeira = ORDEM.find((candidata) => abas.has(candidata))
  if (primeira) aba.value = primeira
}

function aoErrar(erro: unknown) {
  mostrarErrosDoServidor(
    erro,
    (campo, mensagem) => {
      setFieldError(campo, mensagem)
      abrirPrimeiraAbaComErro([campo])
    },
    [...CAMPOS],
    'Não foi possível salvar o produto.',
  )
}

const salvar = handleSubmit(
  (dados) => {
    const corpo = paraApi(dados)
    const aoSalvar = {
      onSuccess: () => {
        toast.success(props.produto ? 'Produto alterado.' : 'Produto cadastrado.')
        emit('fechar')
      },
      onError: aoErrar,
    }
    if (props.produto) alterar.mutate(corpo, aoSalvar)
    else cadastrar.mutate(corpo, aoSalvar)
  },
  ({ errors: invalidos }) => abrirPrimeiraAbaComErro(Object.keys(invalidos)),
)

/** Atributos de um campo com erro. */
const invalido = (mensagem: string | undefined) => (mensagem ? true : undefined)
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <ConteudoDoFormulario chave="produto" largura="sm:w-3xl">
      <DialogHeader>
        <DialogTitle>{{ produto ? 'Alterar produto' : 'Novo produto' }}</DialogTitle>
        <DialogDescription>
          Identificação, preços, estoque e dados fiscais do produto.
        </DialogDescription>
      </DialogHeader>
      <form id="form-produto" novalidate @submit="salvar">
        <Tabs v-model="aba">
          <TabsList class="w-full flex-wrap">
            <TabsTrigger value="identificacao">
              Identificação
              <span v-if="abasComErro.has('identificacao')" class="text-destructive">•</span>
            </TabsTrigger>
            <TabsTrigger value="precos">
              Preços e estoque
              <span v-if="abasComErro.has('precos')" class="text-destructive">•</span>
            </TabsTrigger>
            <TabsTrigger value="fiscal">
              Fiscal e pesos
              <span v-if="abasComErro.has('fiscal')" class="text-destructive">•</span>
            </TabsTrigger>
            <TabsTrigger value="observacoes">
              Observações
              <span v-if="abasComErro.has('observacoes')" class="text-destructive">•</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identificacao" class="pt-4">
            <FieldGroup class="gap-4">
              <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_12rem]">
                <Field :data-invalid="invalido(errors.codigo)">
                  <FieldLabel for="produto-codigo">Código <Obrigatorio /></FieldLabel>
                  <Input
                    id="produto-codigo"
                    :model-value="codigo"
                    maxlength="30"
                    autocomplete="off"
                    class="font-mono uppercase"
                    :aria-invalid="invalido(errors.codigo)"
                    @update:model-value="(valor) => (codigo = String(valor).toUpperCase())"
                  />
                  <FieldError v-if="errors.codigo" :errors="[errors.codigo]" />
                  <FieldDescription v-else>Código interno (SKU).</FieldDescription>
                </Field>
                <Field :data-invalid="invalido(errors.unidade)">
                  <FieldLabel for="produto-unidade">Unidade <Obrigatorio /></FieldLabel>
                  <Select v-model="unidade">
                    <SelectTrigger
                      id="produto-unidade"
                      class="w-full"
                      :aria-invalid="invalido(errors.unidade)"
                    >
                      <SelectValue placeholder="Escolha" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem
                        v-for="opcao in opcoes.data.value?.unidades"
                        :key="opcao.valor"
                        :value="opcao.valor"
                      >
                        {{ opcao.valor }} — {{ opcao.descricao }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FieldError :errors="[errors.unidade]" />
                </Field>
              </div>
              <Field :data-invalid="invalido(errors.descricao)">
                <FieldLabel for="produto-descricao">Descrição <Obrigatorio /></FieldLabel>
                <Input
                  id="produto-descricao"
                  v-model="descricao"
                  maxlength="120"
                  :aria-invalid="invalido(errors.descricao)"
                />
                <FieldError v-if="errors.descricao" :errors="[errors.descricao]" />
                <FieldDescription v-else>Sai na venda e na NF-e.</FieldDescription>
              </Field>
              <div class="grid gap-4 sm:grid-cols-2">
                <Field :data-invalid="invalido(errors.categoria)">
                  <FieldLabel for="produto-categoria">Categoria</FieldLabel>
                  <Input
                    id="produto-categoria"
                    v-model="categoria"
                    maxlength="60"
                    list="produto-categorias"
                    autocomplete="off"
                    :aria-invalid="invalido(errors.categoria)"
                  />
                  <datalist id="produto-categorias">
                    <option
                      v-for="sugestao in opcoes.data.value?.categorias"
                      :key="sugestao"
                      :value="sugestao"
                    />
                  </datalist>
                  <FieldError :errors="[errors.categoria]" />
                </Field>
                <Field :data-invalid="invalido(errors.codigo_barras)">
                  <FieldLabel for="produto-codigo-barras">Código de barras (EAN)</FieldLabel>
                  <Input
                    id="produto-codigo-barras"
                    v-model="codigoBarras"
                    inputmode="numeric"
                    maxlength="17"
                    autocomplete="off"
                    class="font-mono"
                    :aria-invalid="invalido(errors.codigo_barras)"
                  />
                  <FieldError :errors="[errors.codigo_barras]" />
                </Field>
              </div>
              <label class="flex items-center gap-2 text-sm">
                <Checkbox
                  :model-value="ativo"
                  @update:model-value="(marcado) => (ativo = marcado === true)"
                />
                Produto ativo
                <span class="text-muted-foreground">(inativo não aparece nas vendas)</span>
              </label>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="precos" class="pt-4">
            <FieldGroup class="gap-4">
              <div class="grid gap-4 sm:grid-cols-3">
                <Field :data-invalid="invalido(errors['precos.custo'])">
                  <FieldLabel for="produto-custo">Preço de custo (R$)</FieldLabel>
                  <Input
                    id="produto-custo"
                    v-model="custo"
                    inputmode="decimal"
                    placeholder="0,00"
                    :aria-invalid="invalido(errors['precos.custo'])"
                  />
                  <FieldError :errors="[errors['precos.custo']]" />
                </Field>
                <Field :data-invalid="invalido(errors['precos.venda'])">
                  <FieldLabel for="produto-venda"> Preço de venda (R$) <Obrigatorio /> </FieldLabel>
                  <Input
                    id="produto-venda"
                    v-model="venda"
                    inputmode="decimal"
                    placeholder="0,00"
                    :aria-invalid="invalido(errors['precos.venda'])"
                  />
                  <FieldError :errors="[errors['precos.venda']]" />
                </Field>
                <Field>
                  <FieldLabel for="produto-margem">Margem</FieldLabel>
                  <Input
                    id="produto-margem"
                    :model-value="margem === null ? '—' : `${margem.toLocaleString('pt-BR')} %`"
                    readonly
                    tabindex="-1"
                    class="bg-muted"
                    :class="margem !== null && margem < 0 ? 'text-destructive' : undefined"
                  />
                  <FieldDescription>Sobre o custo, calculada.</FieldDescription>
                </Field>
              </div>
              <label class="flex items-center gap-2 text-sm">
                <Checkbox
                  :model-value="controla"
                  @update:model-value="(marcado) => (controla = marcado === true)"
                />
                Controla estoque
                <span class="text-muted-foreground">(desmarque para serviços e encomendas)</span>
              </label>
              <div class="grid gap-4 sm:grid-cols-2">
                <Field>
                  <FieldLabel for="produto-estoque-atual">Estoque atual</FieldLabel>
                  <!-- Só leitura: o saldo muda pela entrada de notas e pelas vendas. -->
                  <Input
                    id="produto-estoque-atual"
                    :model-value="estoqueAtual"
                    readonly
                    disabled
                    class="bg-muted"
                  />
                  <FieldDescription v-if="controla && estoqueNegativo" class="text-amber-600">
                    Estoque negativo: houve venda sem saldo.
                  </FieldDescription>
                  <FieldDescription v-else>Atualizado pela entrada de notas.</FieldDescription>
                </Field>
                <Field :data-invalid="invalido(errors['estoque.minimo'])">
                  <FieldLabel for="produto-estoque-minimo">Estoque mínimo</FieldLabel>
                  <Input
                    id="produto-estoque-minimo"
                    v-model="estoqueMinimo"
                    inputmode="decimal"
                    :disabled="!controla"
                    :aria-invalid="invalido(errors['estoque.minimo'])"
                  />
                  <FieldError
                    v-if="errors['estoque.minimo']"
                    :errors="[errors['estoque.minimo']]"
                  />
                  <FieldDescription v-else>A listagem avisa quando chegar nele.</FieldDescription>
                </Field>
              </div>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="fiscal" class="pt-4">
            <FieldGroup class="gap-4">
              <div class="grid gap-4 sm:grid-cols-2">
                <Field :data-invalid="invalido(errors['fiscal.ncm'])">
                  <FieldLabel for="produto-ncm">NCM</FieldLabel>
                  <Input
                    id="produto-ncm"
                    :model-value="ncm"
                    inputmode="numeric"
                    placeholder="0000.00.00"
                    maxlength="10"
                    class="font-mono"
                    :aria-invalid="invalido(errors['fiscal.ncm'])"
                    @update:model-value="(valor) => (ncm = formatarNcm(String(valor)))"
                  />
                  <FieldError v-if="errors['fiscal.ncm']" :errors="[errors['fiscal.ncm']]" />
                  <FieldDescription v-else>Obrigatório para emitir a NF-e.</FieldDescription>
                </Field>
                <Field :data-invalid="invalido(errors['fiscal.cest'])">
                  <FieldLabel for="produto-cest">CEST</FieldLabel>
                  <Input
                    id="produto-cest"
                    :model-value="cest"
                    inputmode="numeric"
                    placeholder="00.000.00"
                    maxlength="9"
                    class="font-mono"
                    :aria-invalid="invalido(errors['fiscal.cest'])"
                    @update:model-value="(valor) => (cest = formatarCest(String(valor)))"
                  />
                  <FieldError v-if="errors['fiscal.cest']" :errors="[errors['fiscal.cest']]" />
                  <FieldDescription v-else
                    >Só para itens com substituição tributária.</FieldDescription
                  >
                </Field>
              </div>
              <Field :data-invalid="invalido(errors['fiscal.origem'])">
                <FieldLabel for="produto-origem">Origem da mercadoria <Obrigatorio /></FieldLabel>
                <Select v-model="origem">
                  <SelectTrigger id="produto-origem" class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="opcao in opcoes.data.value?.origens"
                      :key="opcao.valor"
                      :value="String(opcao.valor)"
                    >
                      {{ opcao.valor }} — {{ opcao.descricao }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError :errors="[errors['fiscal.origem']]" />
              </Field>
              <div class="grid gap-4 sm:grid-cols-2">
                <Field :data-invalid="invalido(errors['pesos.bruto'])">
                  <FieldLabel for="produto-peso-bruto">Peso bruto (kg)</FieldLabel>
                  <Input
                    id="produto-peso-bruto"
                    v-model="pesoBruto"
                    inputmode="decimal"
                    placeholder="0,000"
                    :aria-invalid="invalido(errors['pesos.bruto'])"
                  />
                  <FieldError :errors="[errors['pesos.bruto']]" />
                </Field>
                <Field :data-invalid="invalido(errors['pesos.liquido'])">
                  <FieldLabel for="produto-peso-liquido">Peso líquido (kg)</FieldLabel>
                  <Input
                    id="produto-peso-liquido"
                    v-model="pesoLiquido"
                    inputmode="decimal"
                    placeholder="0,000"
                    :aria-invalid="invalido(errors['pesos.liquido'])"
                  />
                  <FieldError :errors="[errors['pesos.liquido']]" />
                </Field>
              </div>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="observacoes" class="pt-4">
            <Field :data-invalid="invalido(errors.observacoes)">
              <FieldLabel for="produto-observacoes">Observações</FieldLabel>
              <Textarea
                id="produto-observacoes"
                v-model="observacoes"
                rows="6"
                maxlength="5000"
                :aria-invalid="invalido(errors.observacoes)"
              />
              <FieldError :errors="[errors.observacoes]" />
            </Field>
          </TabsContent>
        </Tabs>
      </form>
      <DialogFooter>
        <Button type="submit" form="form-produto" :disabled="salvando">
          <Spinner v-if="salvando" data-icon="inline-start" />
          {{ produto ? 'Salvar' : 'Cadastrar' }}
        </Button>
      </DialogFooter>
    </ConteudoDoFormulario>
  </Dialog>
</template>
