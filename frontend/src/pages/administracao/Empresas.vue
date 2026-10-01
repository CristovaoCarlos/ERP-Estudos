<script setup lang="ts">
import { Building2 } from '@lucide/vue'
import { computed } from 'vue'

import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Spinner } from '@/components/ui/spinner'
import { formatarCnpj } from '@/lib/cnpj'
import { useEmpresas, type Empresa } from '@/lib/empresas'
import { useSelecao, type Coluna } from '@/lib/listagem'
import NovaEmpresa from '@/pages/administracao/empresas/NovaEmpresa.vue'

const data = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short' })

const colunas: Coluna<Empresa>[] = [
  {
    id: 'nome',
    titulo: 'Nome',
    className: 'font-medium',
    valor: (empresa) => empresa.nome ?? empresa.id,
    busca: (empresa) => `${empresa.nome ?? ''} ${empresa.id}`,
  },
  {
    id: 'cnpj',
    titulo: 'CNPJ',
    className: 'font-mono text-xs',
    valor: (empresa) => (empresa.cnpj ? formatarCnpj(empresa.cnpj) : '—'),
    busca: (empresa) => (empresa.cnpj ? `${empresa.cnpj} ${formatarCnpj(empresa.cnpj)}` : ''),
  },
  {
    id: 'dominio',
    titulo: 'Endereço',
    className: 'font-mono text-xs',
    valor: (empresa) => empresa.dominio ?? '—',
    busca: (empresa) => empresa.dominio,
  },
  { id: 'situacao', titulo: 'Situação' },
  {
    id: 'criada_em',
    titulo: 'Cadastrada em',
    className: 'text-right text-muted-foreground',
    valor: (empresa) => (empresa.criada_em ? data.format(new Date(empresa.criada_em)) : '—'),
  },
]

const situacoes = [
  { valor: 'ativa', rotulo: 'Ativa' },
  { valor: 'provisionando', rotulo: 'Provisionando' },
] as const

const empresas = useEmpresas()
const filtro = useSelecao<Empresa['situacao']>()

const filtradas = computed(() =>
  filtro.selecionados.value.length
    ? empresas.data.value?.filter((empresa) => filtro.selecionados.value.includes(empresa.situacao))
    : empresas.data.value,
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Empresas</h1>
        <p class="text-muted-foreground">
          Prefeituras clientes do ERP para Estudos. Cada uma tem endereço e banco de dados próprios.
        </p>
      </div>
      <NovaEmpresa />
    </div>

    <Listagem
      chave="empresas"
      :itens="filtradas"
      :carregando="empresas.isPending.value"
      :erro="empresas.isError.value"
      :colunas="colunas"
      :identificador="(empresa) => empresa.id"
      placeholder="Buscar por nome, CNPJ ou endereço…"
      :filtros-ativos="filtro.selecionados.value.length"
      :vazio="{
        titulo: 'Nenhuma empresa cadastrada',
        descricao: 'Cadastre a primeira em “Nova empresa”.',
        icone: Building2,
      }"
      @limpar-filtros="filtro.limpar"
    >
      <template #filtros>
        <ItemDeFiltro
          v-for="situacao in situacoes"
          :key="situacao.valor"
          :marcado="filtro.selecionados.value.includes(situacao.valor)"
          @alternar="(marcado) => filtro.alternar(situacao.valor, marcado)"
        >
          {{ situacao.rotulo }}
        </ItemDeFiltro>
      </template>
      <template #coluna-situacao="{ item }">
        <Badge v-if="item.situacao === 'ativa'" variant="secondary">Ativa</Badge>
        <Badge v-else variant="outline">
          <Spinner />
          Provisionando
        </Badge>
      </template>
    </Listagem>
  </div>
</template>
