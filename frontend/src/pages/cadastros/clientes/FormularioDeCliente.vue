<script setup lang="ts">
import { computed, ref, watch } from 'vue'
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
  buscarCep,
  CONTRIBUINTE,
  formatarCep,
  formatarDocumento,
  formatarTelefone,
  INDICADORES_IE,
  lerLocalizacao,
  linkDoGoogleMaps,
  useAlterarCliente,
  useCadastrarCliente,
  useCidadesDaUf,
  type Cliente,
} from '@/lib/cadastros-clientes'
import { somenteDigitos } from '@/lib/cpf'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import CampoUf from '@/pages/administracao/tabelas-comuns/cidades/CampoUf.vue'
import {
  abaDoCampo,
  CAMPOS,
  esquemaDoCliente,
  paraApi,
  valoresIniciais,
  type Aba,
} from '@/pages/cadastros/clientes/esquema'

/** `cliente` ausente: cadastro. Presente: alteração. */
const props = defineProps<{ cliente?: Cliente }>()
const emit = defineEmits<{ fechar: [] }>()

const cadastrar = useCadastrarCliente()
const alterar = useAlterarCliente(props.cliente?.id ?? 0)
const salvando = computed(() => (props.cliente ? alterar : cadastrar).isPending.value)

const { campo, errors, handleSubmit, setFieldError } = useFormulario(
  esquemaDoCliente,
  valoresIniciais(props.cliente),
)
const [tipo] = campo('tipo_pessoa')
const [documento] = campo('cpf_cnpj')
const [nome] = campo('nome')
const [fantasia] = campo('nome_fantasia')
const [rg] = campo('rg')
const [nascimento] = campo('data_nascimento')
const [cep] = campo('endereco.cep')
const [logradouro] = campo('endereco.logradouro')
const [numero] = campo('endereco.numero')
const [complemento] = campo('endereco.complemento')
const [bairro] = campo('endereco.bairro')
const [uf] = campo('endereco.uf')
const [cidade] = campo('endereco.cidade')
const [localizacao] = campo('endereco.localizacao')
const [email] = campo('contato.email')
const [telefone] = campo('contato.telefone')
const [celular] = campo('contato.celular')
const [indicadorIe] = campo('fiscal.indicador_ie')
const [ie] = campo('fiscal.inscricao_estadual')
const [im] = campo('fiscal.inscricao_municipal')
const [consumidorFinal] = campo('fiscal.consumidor_final')
const [limite] = campo('limite_credito')
const [observacoes] = campo('observacoes')
const [ativo] = campo('ativo')

const juridica = computed(() => tipo.value === 'J')
const contribuinte = computed(() => Number(indicadorIe.value) === CONTRIBUINTE)
const cidades = useCidadesDaUf(() => uf.value ?? '')

// Trocar o tipo de pessoa troca o documento (CPF ↔ CNPJ): começa em branco.
watch(tipo, () => (documento.value = ''))
// A cidade escolhida é da UF anterior.
watch(uf, () => (cidade.value = ''))

/**
 * CEP completo digitado: o ViaCEP preenche logradouro, bairro, UF e cidade (o complemento, só se
 * estiver vazio). A cidade é achada pelo código do IBGE quando a lista da UF chega.
 */
const buscandoCep = ref(false)
const cidadeDoCep = ref<string | null>(null)
let ultimoCepBuscado = ''

watch([cidadeDoCep, () => cidades.data.value], ([ibge, lista]) => {
  const achada = ibge ? lista?.find((opcao) => opcao.codigo_ibge === ibge) : undefined
  if (!achada) return
  cidade.value = String(achada.id)
  cidadeDoCep.value = null
})

async function aoDigitarCep(valor: string) {
  cep.value = formatarCep(valor)
  const digitos = somenteDigitos(cep.value)
  if (digitos.length !== 8 || digitos === ultimoCepBuscado) return
  ultimoCepBuscado = digitos

  buscandoCep.value = true
  try {
    const endereco = await buscarCep(digitos)
    // O usuário mudou o CEP enquanto a consulta corria: vale a consulta nova.
    if (somenteDigitos(cep.value ?? '') !== digitos) return
    if (!endereco) {
      setFieldError('endereco.cep', 'CEP não encontrado. Confira o número ou preencha o endereço.')
      return
    }
    if (endereco.logradouro) logradouro.value = endereco.logradouro
    if (endereco.bairro) bairro.value = endereco.bairro
    if (endereco.complemento && !complemento.value) complemento.value = endereco.complemento
    if (endereco.uf) {
      uf.value = endereco.uf
      cidadeDoCep.value = endereco.codigo_ibge || null
    }
  } catch {
    toast.warning('Não foi possível consultar o CEP agora. Preencha o endereço.')
  } finally {
    buscandoCep.value = false
  }
}

const aba = ref<Aba>('identificacao')
const abasComErro = computed(
  () => new Set(Object.keys(errors.value).map((campo) => abaDoCampo(campo))),
)
const ORDEM: Aba[] = ['identificacao', 'endereco', 'fiscal', 'observacoes']
function abrirPrimeiraAbaComErro(campos: string[]) {
  const abas = new Set(campos.map(abaDoCampo))
  const primeira = ORDEM.find((candidata) => abas.has(candidata))
  if (primeira) aba.value = primeira
}

/** Ponto da localização digitada, para o link do Google Maps. */
const coordenadas = computed(() => lerLocalizacao(localizacao.value ?? ''))

// A API recebe latitude e longitude separadas; na tela, são um campo só.
const CAMPO_DA_TELA: Record<string, (typeof CAMPOS)[number]> = {
  'endereco.latitude': 'endereco.localizacao',
  'endereco.longitude': 'endereco.localizacao',
}

function aoErrar(erro: unknown) {
  mostrarErrosDoServidor(
    erro,
    (campo, mensagem) => {
      const daTela = CAMPO_DA_TELA[campo] ?? (campo as (typeof CAMPOS)[number])
      setFieldError(daTela, mensagem)
      abrirPrimeiraAbaComErro([daTela])
    },
    [...CAMPOS, ...Object.keys(CAMPO_DA_TELA)],
    'Não foi possível salvar o cliente.',
  )
}

const salvar = handleSubmit(
  (dados) => {
    const corpo = paraApi(dados)
    const aoSalvar = {
      onSuccess: () => {
        toast.success(props.cliente ? 'Cliente alterado.' : 'Cliente cadastrado.')
        emit('fechar')
      },
      onError: aoErrar,
    }
    if (props.cliente) alterar.mutate(corpo, aoSalvar)
    else cadastrar.mutate(corpo, aoSalvar)
  },
  ({ errors: invalidos }) => abrirPrimeiraAbaComErro(Object.keys(invalidos)),
)

/** Atributos de um campo com erro. */
const invalido = (mensagem: string | undefined) => (mensagem ? true : undefined)
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <ConteudoDoFormulario chave="cliente" largura="sm:w-3xl">
      <DialogHeader>
        <DialogTitle>{{ cliente ? 'Alterar cliente' : 'Novo cliente' }}</DialogTitle>
        <DialogDescription>
          Dados de identificação, endereço, fiscais e comerciais do cliente.
        </DialogDescription>
      </DialogHeader>
      <form id="form-cliente" novalidate @submit="salvar">
        <Tabs v-model="aba">
          <TabsList class="w-full flex-wrap">
            <TabsTrigger value="identificacao">
              Identificação
              <span v-if="abasComErro.has('identificacao')" class="text-destructive">•</span>
            </TabsTrigger>
            <TabsTrigger value="endereco">
              Endereço e contato
              <span v-if="abasComErro.has('endereco')" class="text-destructive">•</span>
            </TabsTrigger>
            <TabsTrigger value="fiscal">
              Fiscal e comercial
              <span v-if="abasComErro.has('fiscal')" class="text-destructive">•</span>
            </TabsTrigger>
            <TabsTrigger value="observacoes">
              Observações
              <span v-if="abasComErro.has('observacoes')" class="text-destructive">•</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="identificacao" class="pt-4">
            <FieldGroup class="gap-4">
              <!-- Linha 1: tipo (estreito), documento e RG. Em PJ, o CNPJ ocupa o lugar do RG. -->
              <div class="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1fr)]">
                <Field>
                  <FieldLabel for="cliente-tipo">Tipo de pessoa <Obrigatorio /></FieldLabel>
                  <Select v-model="tipo">
                    <SelectTrigger id="cliente-tipo" class="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="F">Pessoa física</SelectItem>
                      <SelectItem value="J">Pessoa jurídica</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field
                  :class="juridica ? 'sm:col-span-2' : undefined"
                  :data-invalid="invalido(errors.cpf_cnpj)"
                >
                  <FieldLabel for="cliente-documento"
                    >{{ juridica ? 'CNPJ' : 'CPF' }} <Obrigatorio
                  /></FieldLabel>
                  <Input
                    id="cliente-documento"
                    :model-value="documento"
                    :inputmode="juridica ? 'text' : 'numeric'"
                    :placeholder="juridica ? '00.000.000/0000-00' : '000.000.000-00'"
                    :maxlength="juridica ? 18 : 14"
                    autocomplete="off"
                    class="font-mono"
                    :aria-invalid="invalido(errors.cpf_cnpj)"
                    @update:model-value="
                      (valor) => (documento = formatarDocumento(tipo ?? 'F', String(valor)))
                    "
                  />
                  <FieldError :errors="[errors.cpf_cnpj]" />
                </Field>
                <Field v-if="!juridica" :data-invalid="invalido(errors.rg)">
                  <FieldLabel for="cliente-rg">RG</FieldLabel>
                  <Input
                    id="cliente-rg"
                    v-model="rg"
                    maxlength="20"
                    :aria-invalid="invalido(errors.rg)"
                  />
                  <FieldError :errors="[errors.rg]" />
                </Field>
              </div>

              <!-- Linha 2: nome e nascimento em 90% / 10% (a data não fica abaixo de 10rem). -->
              <div
                class="grid gap-4"
                :class="juridica ? undefined : 'sm:grid-cols-[minmax(0,9fr)_minmax(10rem,1fr)]'"
              >
                <Field :data-invalid="invalido(errors.nome)">
                  <FieldLabel for="cliente-nome"
                    >{{ juridica ? 'Razão social' : 'Nome' }} <Obrigatorio
                  /></FieldLabel>
                  <Input
                    id="cliente-nome"
                    v-model="nome"
                    maxlength="150"
                    :aria-invalid="invalido(errors.nome)"
                  />
                  <FieldError :errors="[errors.nome]" />
                </Field>
                <Field v-if="!juridica" :data-invalid="invalido(errors.data_nascimento)">
                  <FieldLabel for="cliente-nascimento">Data de nascimento</FieldLabel>
                  <Input
                    id="cliente-nascimento"
                    v-model="nascimento"
                    type="date"
                    :aria-invalid="invalido(errors.data_nascimento)"
                  />
                  <FieldError :errors="[errors.data_nascimento]" />
                </Field>
              </div>

              <Field v-if="juridica" :data-invalid="invalido(errors.nome_fantasia)">
                <FieldLabel for="cliente-fantasia">Nome fantasia</FieldLabel>
                <Input
                  id="cliente-fantasia"
                  v-model="fantasia"
                  maxlength="150"
                  :aria-invalid="invalido(errors.nome_fantasia)"
                />
                <FieldError :errors="[errors.nome_fantasia]" />
              </Field>

              <label class="flex items-center gap-2 text-sm">
                <Checkbox
                  :model-value="ativo"
                  @update:model-value="(marcado) => (ativo = marcado === true)"
                />
                Cliente ativo
                <span class="text-muted-foreground">(inativo não aparece nas vendas)</span>
              </label>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="endereco" class="pt-4">
            <FieldGroup class="grid gap-4 sm:grid-cols-6">
              <Field class="sm:col-span-2" :data-invalid="invalido(errors['endereco.cep'])">
                <FieldLabel for="cliente-cep">CEP <Obrigatorio /></FieldLabel>
                <Input
                  id="cliente-cep"
                  :model-value="cep"
                  inputmode="numeric"
                  placeholder="00000-000"
                  maxlength="9"
                  class="font-mono"
                  :aria-invalid="invalido(errors['endereco.cep'])"
                  @update:model-value="(valor) => aoDigitarCep(String(valor))"
                />
                <FieldError v-if="errors['endereco.cep']" :errors="[errors['endereco.cep']]" />
                <FieldDescription v-else-if="buscandoCep">Buscando o endereço…</FieldDescription>
                <FieldDescription v-else>Preenche o endereço pelo CEP.</FieldDescription>
              </Field>
              <Field class="sm:col-span-4" :data-invalid="invalido(errors['endereco.logradouro'])">
                <FieldLabel for="cliente-logradouro">Logradouro <Obrigatorio /></FieldLabel>
                <Input
                  id="cliente-logradouro"
                  v-model="logradouro"
                  maxlength="150"
                  :aria-invalid="invalido(errors['endereco.logradouro'])"
                />
                <FieldError :errors="[errors['endereco.logradouro']]" />
              </Field>
              <Field class="sm:col-span-2" :data-invalid="invalido(errors['endereco.numero'])">
                <FieldLabel for="cliente-numero">Número <Obrigatorio /></FieldLabel>
                <Input
                  id="cliente-numero"
                  v-model="numero"
                  maxlength="10"
                  placeholder="S/N"
                  :aria-invalid="invalido(errors['endereco.numero'])"
                />
                <FieldError :errors="[errors['endereco.numero']]" />
              </Field>
              <Field class="sm:col-span-4" :data-invalid="invalido(errors['endereco.complemento'])">
                <FieldLabel for="cliente-complemento">Complemento</FieldLabel>
                <Input
                  id="cliente-complemento"
                  v-model="complemento"
                  maxlength="60"
                  :aria-invalid="invalido(errors['endereco.complemento'])"
                />
                <FieldError :errors="[errors['endereco.complemento']]" />
              </Field>
              <Field class="sm:col-span-2" :data-invalid="invalido(errors['endereco.bairro'])">
                <FieldLabel for="cliente-bairro">Bairro <Obrigatorio /></FieldLabel>
                <Input
                  id="cliente-bairro"
                  v-model="bairro"
                  maxlength="60"
                  :aria-invalid="invalido(errors['endereco.bairro'])"
                />
                <FieldError :errors="[errors['endereco.bairro']]" />
              </Field>
              <div class="sm:col-span-1">
                <CampoUf id="cliente-uf" v-model="uf" obrigatorio :erro="errors['endereco.uf']" />
              </div>
              <Field class="sm:col-span-3" :data-invalid="invalido(errors['endereco.cidade'])">
                <FieldLabel for="cliente-cidade">Cidade <Obrigatorio /></FieldLabel>
                <Select v-model="cidade" :disabled="!uf || cidades.isPending.value">
                  <SelectTrigger
                    id="cliente-cidade"
                    class="w-full"
                    :aria-invalid="invalido(errors['endereco.cidade'])"
                  >
                    <SelectValue :placeholder="uf ? 'Escolha a cidade' : 'Escolha antes a UF'" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="opcao in cidades.data.value"
                      :key="opcao.id"
                      :value="String(opcao.id)"
                    >
                      {{ opcao.nome }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldError :errors="[errors['endereco.cidade']]" />
              </Field>
              <Field class="sm:col-span-6" :data-invalid="invalido(errors['endereco.localizacao'])">
                <FieldLabel for="cliente-localizacao">Localização</FieldLabel>
                <div class="flex flex-wrap items-center gap-3">
                  <Input
                    id="cliente-localizacao"
                    v-model="localizacao"
                    placeholder="-22.905600, -47.060800"
                    autocomplete="off"
                    class="max-w-xs font-mono"
                    :aria-invalid="invalido(errors['endereco.localizacao'])"
                  />
                  <a
                    v-if="coordenadas"
                    :href="linkDoGoogleMaps(coordenadas)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Ver no Google Maps
                  </a>
                </div>
                <FieldError
                  v-if="errors['endereco.localizacao']"
                  :errors="[errors['endereco.localizacao']]"
                />
                <FieldDescription v-else>
                  Latitude e longitude como o Google Maps copia: clique com o botão direito no ponto
                  do mapa e clique nas coordenadas.
                </FieldDescription>
              </Field>
              <Field class="sm:col-span-6" :data-invalid="invalido(errors['contato.email'])">
                <FieldLabel for="cliente-email">E-mail</FieldLabel>
                <Input
                  id="cliente-email"
                  v-model="email"
                  type="email"
                  maxlength="150"
                  autocomplete="off"
                  :aria-invalid="invalido(errors['contato.email'])"
                />
                <FieldError :errors="[errors['contato.email']]" />
              </Field>
              <Field class="sm:col-span-3" :data-invalid="invalido(errors['contato.celular'])">
                <FieldLabel for="cliente-celular">Celular <Obrigatorio /></FieldLabel>
                <Input
                  id="cliente-celular"
                  :model-value="celular"
                  inputmode="tel"
                  placeholder="(00) 00000-0000"
                  maxlength="15"
                  :aria-invalid="invalido(errors['contato.celular'])"
                  @update:model-value="(valor) => (celular = formatarTelefone(String(valor)))"
                />
                <FieldError :errors="[errors['contato.celular']]" />
              </Field>
              <Field class="sm:col-span-3" :data-invalid="invalido(errors['contato.telefone'])">
                <FieldLabel for="cliente-telefone">Telefone</FieldLabel>
                <Input
                  id="cliente-telefone"
                  :model-value="telefone"
                  inputmode="tel"
                  placeholder="(00) 0000-0000"
                  maxlength="15"
                  :aria-invalid="invalido(errors['contato.telefone'])"
                  @update:model-value="(valor) => (telefone = formatarTelefone(String(valor)))"
                />
                <FieldError :errors="[errors['contato.telefone']]" />
              </Field>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="fiscal" class="pt-4">
            <FieldGroup class="grid gap-4 sm:grid-cols-2">
              <Field class="sm:col-span-2" :data-invalid="invalido(errors['fiscal.indicador_ie'])">
                <FieldLabel for="cliente-indicador-ie"
                  >Indicador da inscrição estadual <Obrigatorio
                /></FieldLabel>
                <Select v-model="indicadorIe">
                  <SelectTrigger id="cliente-indicador-ie" class="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="indicador in INDICADORES_IE"
                      :key="indicador.valor"
                      :value="String(indicador.valor)"
                    >
                      {{ indicador.rotulo }}
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FieldDescription
                  >Vai na NF-e como indicador da IE do destinatário.</FieldDescription
                >
              </Field>
              <Field :data-invalid="invalido(errors['fiscal.inscricao_estadual'])">
                <FieldLabel for="cliente-ie"
                  >Inscrição estadual <Obrigatorio v-if="contribuinte"
                /></FieldLabel>
                <Input
                  id="cliente-ie"
                  v-model="ie"
                  maxlength="20"
                  :disabled="!contribuinte"
                  :aria-invalid="invalido(errors['fiscal.inscricao_estadual'])"
                />
                <FieldError
                  v-if="errors['fiscal.inscricao_estadual']"
                  :errors="[errors['fiscal.inscricao_estadual']]"
                />
                <FieldDescription v-else-if="!contribuinte">
                  Só para contribuinte do ICMS.
                </FieldDescription>
              </Field>
              <Field :data-invalid="invalido(errors['fiscal.inscricao_municipal'])">
                <FieldLabel for="cliente-im">Inscrição municipal</FieldLabel>
                <Input
                  id="cliente-im"
                  v-model="im"
                  maxlength="20"
                  :aria-invalid="invalido(errors['fiscal.inscricao_municipal'])"
                />
                <FieldError :errors="[errors['fiscal.inscricao_municipal']]" />
              </Field>
              <label class="flex items-center gap-2 text-sm sm:col-span-2">
                <Checkbox
                  :model-value="consumidorFinal"
                  @update:model-value="(marcado) => (consumidorFinal = marcado === true)"
                />
                Consumidor final
              </label>
              <Field :data-invalid="invalido(errors.limite_credito)">
                <FieldLabel for="cliente-limite">Limite de crédito (R$)</FieldLabel>
                <Input
                  id="cliente-limite"
                  v-model="limite"
                  inputmode="decimal"
                  placeholder="0,00"
                  :aria-invalid="invalido(errors.limite_credito)"
                />
                <FieldError v-if="errors.limite_credito" :errors="[errors.limite_credito]" />
                <FieldDescription v-else>Em branco: sem limite.</FieldDescription>
              </Field>
            </FieldGroup>
          </TabsContent>

          <TabsContent value="observacoes" class="pt-4">
            <Field :data-invalid="invalido(errors.observacoes)">
              <FieldLabel for="cliente-observacoes">Observações</FieldLabel>
              <Textarea
                id="cliente-observacoes"
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
        <Button type="submit" form="form-cliente" :disabled="salvando">
          <Spinner v-if="salvando" data-icon="inline-start" />
          {{ cliente ? 'Salvar' : 'Cadastrar' }}
        </Button>
      </DialogFooter>
    </ConteudoDoFormulario>
  </Dialog>
</template>
