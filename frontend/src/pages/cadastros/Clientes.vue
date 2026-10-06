<script setup lang="ts">
import { Contact, Pencil, Plus, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import DialogoDeConfirmacao from '@/components/DialogoDeConfirmacao.vue'
import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import {
  formatarDocumento,
  formatarTelefone,
  useClientes,
  useRemoverCliente,
  type Cliente,
  type TipoPessoa,
} from '@/lib/cadastros-clientes'
import { useSelecao, type Coluna } from '@/lib/listagem'
import FormularioDeCliente from '@/pages/cadastros/clientes/FormularioDeCliente.vue'

const cidadeDo = (cliente: Cliente) =>
  cliente.endereco.cidade ? `${cliente.endereco.cidade.nome}/${cliente.endereco.cidade.uf}` : null
const telefoneDo = (cliente: Cliente) => {
  const numero = cliente.contato.celular ?? cliente.contato.telefone
  return numero ? formatarTelefone(numero) : null
}

const colunas: Coluna<Cliente>[] = [
  {
    id: 'nome',
    titulo: 'Nome',
    className: 'font-medium',
    busca: (cliente) => `${cliente.nome} ${cliente.nome_fantasia ?? ''}`,
  },
  {
    id: 'documento',
    titulo: 'CPF/CNPJ',
    className: 'font-mono text-xs whitespace-nowrap',
    valor: (cliente) => formatarDocumento(cliente.tipo_pessoa, cliente.cpf_cnpj),
    busca: (cliente) =>
      `${cliente.cpf_cnpj} ${formatarDocumento(cliente.tipo_pessoa, cliente.cpf_cnpj)}`,
  },
  {
    id: 'cidade',
    titulo: 'Cidade',
    className: 'text-muted-foreground',
    valor: (cliente) => cidadeDo(cliente) ?? '—',
    busca: cidadeDo,
  },
  {
    id: 'telefone',
    titulo: 'Telefone',
    className: 'text-muted-foreground whitespace-nowrap',
    valor: (cliente) => telefoneDo(cliente) ?? '—',
  },
  {
    id: 'email',
    titulo: 'E-mail',
    className: 'text-muted-foreground',
    ocultaPorPadrao: true,
    valor: (cliente) => cliente.contato.email ?? '—',
    busca: (cliente) => cliente.contato.email,
  },
  { id: 'situacao', titulo: 'Situação' },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-24 text-right whitespace-nowrap' },
]

const tipos: { valor: TipoPessoa; rotulo: string }[] = [
  { valor: 'F', rotulo: 'Pessoa física' },
  { valor: 'J', rotulo: 'Pessoa jurídica' },
]
const situacoes = [
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'inativo', rotulo: 'Inativos' },
] as const

const clientes = useClientes()
const remover = useRemoverCliente()
const cadastrando = ref(false)
const emEdicao = ref<Cliente | null>(null)
const excluindo = ref<Cliente | null>(null)
const filtroDeTipo = useSelecao<TipoPessoa>()
const filtroDeSituacao = useSelecao<'ativo' | 'inativo'>()

const filtrados = computed(() =>
  clientes.data.value?.filter(
    (cliente) =>
      (!filtroDeTipo.selecionados.value.length ||
        filtroDeTipo.selecionados.value.includes(cliente.tipo_pessoa)) &&
      (!filtroDeSituacao.selecionados.value.length ||
        filtroDeSituacao.selecionados.value.includes(cliente.ativo ? 'ativo' : 'inativo')),
  ),
)

function limparFiltros() {
  filtroDeTipo.limpar()
  filtroDeSituacao.limpar()
}

function excluir() {
  const cliente = excluindo.value
  if (!cliente) return
  remover.mutate(cliente.id, {
    onSuccess: () => {
      toast.success(`Cliente ${cliente.nome} excluído.`)
      excluindo.value = null
    },
    onError: () => toast.error('Não foi possível excluir o cliente.'),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Clientes</h1>
        <p class="text-muted-foreground">
          Pessoas e empresas atendidas, com endereço, contatos e dados fiscais.
        </p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Novo cliente
      </Button>
    </div>

    <Listagem
      chave="cadastros-clientes"
      :itens="filtrados"
      :carregando="clientes.isPending.value"
      :erro="clientes.isError.value"
      :colunas="colunas"
      :identificador="(cliente) => cliente.id"
      placeholder="Buscar por nome, CPF/CNPJ, cidade ou e-mail…"
      :filtros-ativos="
        filtroDeTipo.selecionados.value.length + filtroDeSituacao.selecionados.value.length
      "
      :destacar="(cliente) => (cliente.ativo ? undefined : 'opacity-60')"
      :vazio="{
        titulo: 'Nenhum cliente',
        descricao: 'Cadastre o primeiro em “Novo cliente”.',
        icone: Contact,
      }"
      @limpar-filtros="limparFiltros"
    >
      <template #filtros>
        <DropdownMenuLabel class="text-xs text-muted-foreground">Tipo de pessoa</DropdownMenuLabel>
        <ItemDeFiltro
          v-for="tipo in tipos"
          :key="tipo.valor"
          :marcado="filtroDeTipo.selecionados.value.includes(tipo.valor)"
          @alternar="(marcado) => filtroDeTipo.alternar(tipo.valor, marcado)"
        >
          {{ tipo.rotulo }}
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
      </template>
      <template #coluna-nome="{ item }">
        <div class="flex flex-col">
          <span>{{ item.nome }}</span>
          <span v-if="item.nome_fantasia" class="text-xs font-normal text-muted-foreground">
            {{ item.nome_fantasia }}
          </span>
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
          :aria-label="`Alterar ${item.nome}`"
          @click="emEdicao = item"
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`Excluir ${item.nome}`"
          @click="excluindo = item"
        >
          <Trash2 />
        </Button>
      </template>
    </Listagem>

    <FormularioDeCliente v-if="cadastrando" @fechar="cadastrando = false" />
    <FormularioDeCliente v-if="emEdicao" :cliente="emEdicao" @fechar="emEdicao = null" />
    <DialogoDeConfirmacao
      :aberto="excluindo !== null"
      titulo="Excluir cliente"
      rotulo-do-botao="Excluir"
      :processando="remover.isPending.value"
      @confirmar="excluir"
      @fechar="excluindo = null"
    >
      {{ excluindo?.nome }} sai do cadastro de clientes. Esta ação não pode ser desfeita; para só
      deixar de usar o cliente, prefira marcá-lo como inativo.
    </DialogoDeConfirmacao>
  </div>
</template>
