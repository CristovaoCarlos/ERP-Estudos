<script setup lang="ts">
import { BriefcaseBusiness, Pencil, Plus, Trash2 } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import DialogoDeConfirmacao from '@/components/DialogoDeConfirmacao.vue'
import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu'
import { formatarTelefone } from '@/lib/cadastros-clientes'
import { useRemoverVendedor, useVendedores, type Vendedor } from '@/lib/cadastros-vendedores'
import { formatarCpf } from '@/lib/cpf'
import { useSelecao, type Coluna } from '@/lib/listagem'
import { formatarMoeda } from '@/lib/numeros'
import FormularioDeVendedor from '@/pages/cadastros/vendedores/FormularioDeVendedor.vue'

const colunas: Coluna<Vendedor>[] = [
  {
    id: 'nome',
    titulo: 'Nome',
    className: 'font-medium',
    valor: (vendedor) => vendedor.nome,
    busca: (vendedor) => vendedor.nome,
  },
  {
    id: 'cpf',
    titulo: 'CPF',
    className: 'font-mono text-xs whitespace-nowrap',
    valor: (vendedor) => formatarCpf(vendedor.cpf),
    busca: (vendedor) => `${vendedor.cpf} ${formatarCpf(vendedor.cpf)}`,
  },
  {
    id: 'celular',
    titulo: 'Celular',
    className: 'text-muted-foreground whitespace-nowrap',
    valor: (vendedor) => formatarTelefone(vendedor.contato.celular),
  },
  {
    id: 'regiao',
    titulo: 'Região',
    className: 'text-muted-foreground',
    valor: (vendedor) => vendedor.comercial.regiao ?? '—',
    busca: (vendedor) => vendedor.comercial.regiao,
  },
  {
    id: 'comissao',
    titulo: 'Comissão',
    className: 'text-right whitespace-nowrap',
    valor: (vendedor) => `${Number(vendedor.comercial.comissao).toLocaleString('pt-BR')}%`,
  },
  {
    id: 'meta',
    titulo: 'Meta mensal',
    className: 'text-right whitespace-nowrap',
    valor: (vendedor) =>
      vendedor.comercial.meta_mensal ? formatarMoeda(vendedor.comercial.meta_mensal) : '—',
  },
  {
    id: 'email',
    titulo: 'E-mail',
    className: 'text-muted-foreground',
    ocultaPorPadrao: true,
    valor: (vendedor) => vendedor.contato.email ?? '—',
    busca: (vendedor) => vendedor.contato.email,
  },
  { id: 'situacao', titulo: 'Situação' },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-24 text-right whitespace-nowrap' },
]

const situacoes = [
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'inativo', rotulo: 'Inativos' },
] as const

const vendedores = useVendedores()
const remover = useRemoverVendedor()
const cadastrando = ref(false)
const emEdicao = ref<Vendedor | null>(null)
const excluindo = ref<Vendedor | null>(null)
const filtroDeRegiao = useSelecao<string>()
const filtroDeSituacao = useSelecao<'ativo' | 'inativo'>()

const regioes = computed(
  () =>
    [
      ...new Set(
        vendedores.data.value
          ?.map((vendedor) => vendedor.comercial.regiao)
          .filter((regiao) => !!regiao),
      ),
    ].sort() as string[],
)

const filtrados = computed(() =>
  vendedores.data.value?.filter(
    (vendedor) =>
      (!filtroDeRegiao.selecionados.value.length ||
        filtroDeRegiao.selecionados.value.includes(vendedor.comercial.regiao ?? '')) &&
      (!filtroDeSituacao.selecionados.value.length ||
        filtroDeSituacao.selecionados.value.includes(vendedor.ativo ? 'ativo' : 'inativo')),
  ),
)

function limparFiltros() {
  filtroDeRegiao.limpar()
  filtroDeSituacao.limpar()
}

function excluir() {
  const vendedor = excluindo.value
  if (!vendedor) return
  remover.mutate(vendedor.id, {
    onSuccess: () => {
      toast.success(`Vendedor ${vendedor.nome} excluído.`)
      excluindo.value = null
    },
    onError: () => toast.error('Não foi possível excluir o vendedor.'),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Vendedores</h1>
        <p class="text-muted-foreground">
          Quem vende, com contato, comissão, meta mensal e região de atuação.
        </p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Novo vendedor
      </Button>
    </div>

    <Listagem
      chave="cadastros-vendedores"
      :itens="filtrados"
      :carregando="vendedores.isPending.value"
      :erro="vendedores.isError.value"
      :colunas="colunas"
      :identificador="(vendedor) => vendedor.id"
      placeholder="Buscar por nome, CPF, região ou e-mail…"
      :filtros-ativos="
        filtroDeRegiao.selecionados.value.length + filtroDeSituacao.selecionados.value.length
      "
      :destacar="(vendedor) => (vendedor.ativo ? undefined : 'opacity-60')"
      :vazio="{
        titulo: 'Nenhum vendedor',
        descricao: 'Cadastre o primeiro em “Novo vendedor”.',
        icone: BriefcaseBusiness,
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
        <template v-if="regioes.length">
          <DropdownMenuSeparator />
          <DropdownMenuLabel class="text-xs text-muted-foreground">Região</DropdownMenuLabel>
          <ItemDeFiltro
            v-for="regiao in regioes"
            :key="regiao"
            :marcado="filtroDeRegiao.selecionados.value.includes(regiao)"
            @alternar="(marcado) => filtroDeRegiao.alternar(regiao, marcado)"
          >
            {{ regiao }}
          </ItemDeFiltro>
        </template>
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

    <FormularioDeVendedor v-if="cadastrando" @fechar="cadastrando = false" />
    <FormularioDeVendedor v-if="emEdicao" :vendedor="emEdicao" @fechar="emEdicao = null" />
    <DialogoDeConfirmacao
      :aberto="excluindo !== null"
      titulo="Excluir vendedor"
      rotulo-do-botao="Excluir"
      :processando="remover.isPending.value"
      @confirmar="excluir"
      @fechar="excluindo = null"
    >
      {{ excluindo?.nome }} sai do cadastro de vendedores. Esta ação não pode ser desfeita; para só
      deixar de usar o vendedor, prefira marcá-lo como inativo.
    </DialogoDeConfirmacao>
  </div>
</template>
