<script setup lang="ts">
import { Landmark, Plus } from '@lucide/vue'
import { ref } from 'vue'

import Listagem from '@/components/Listagem.vue'
import { Button } from '@/components/ui/button'
import { useBancos, type Banco } from '@/lib/administracao-tabelas-comuns-bancos'
import type { Coluna } from '@/lib/listagem'
import NovoBanco from '@/pages/administracao/tabelas-comuns/bancos/NovoBanco.vue'

const colunas: Coluna<Banco>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono text-muted-foreground',
    valor: (banco) => banco.codigo,
    busca: (banco) => banco.codigo,
  },
  {
    id: 'nome',
    titulo: 'Banco',
    className: 'font-medium',
    valor: (banco) => banco.nome,
    busca: (banco) => banco.nome,
  },
]

const cadastrando = ref(false)
const bancos = useBancos()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Bancos</h1>
        <p class="text-muted-foreground">Bancos com o código de compensação.</p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Novo banco
      </Button>
    </div>

    <Listagem
      chave="administracao-tabelas-comuns-bancos"
      :itens="bancos.data.value"
      :carregando="bancos.isPending.value"
      :erro="bancos.isError.value"
      :colunas="colunas"
      :identificador="(banco) => banco.id"
      placeholder="Buscar por código ou nome…"
      :vazio="{
        titulo: 'Nenhum banco',
        descricao: 'A tabela de bancos do banco central está vazia.',
        icone: Landmark,
      }"
    />

    <NovoBanco v-if="cadastrando" @fechar="cadastrando = false" />
  </div>
</template>
