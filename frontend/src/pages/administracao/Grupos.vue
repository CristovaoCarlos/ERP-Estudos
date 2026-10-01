<script setup lang="ts">
import { LockKeyhole, Pencil, Plus, Trash2 } from '@lucide/vue'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

import DialogoDeConfirmacao from '@/components/DialogoDeConfirmacao.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { errosDosCampos } from '@/lib/empresas'
import { useGrupos, useRemoverGrupo, type Grupo } from '@/lib/grupos'
import type { Coluna } from '@/lib/listagem'
import FormularioDeGrupo from '@/pages/administracao/grupos/FormularioDeGrupo.vue'

const colunas: Coluna<Grupo>[] = [
  { id: 'nome', titulo: 'Nome', className: 'font-medium', busca: (grupo) => grupo.nome },
  { id: 'telas', titulo: 'Telas' },
  {
    id: 'usuarios',
    titulo: 'Usuários',
    className: 'text-muted-foreground',
    valor: (grupo) => grupo.usuarios,
  },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-24 text-right whitespace-nowrap' },
]

const grupos = useGrupos()
const remover = useRemoverGrupo()
const emEdicao = ref<Grupo | null>(null)
const cadastrando = ref(false)
const excluindo = ref<Grupo | null>(null)

function excluir() {
  const grupo = excluindo.value
  if (!grupo) return
  remover.mutate(grupo.id, {
    onSuccess: () => {
      toast.success(`Grupo ${grupo.nome} excluído.`)
      excluindo.value = null
    },
    onError: (erro) =>
      toast.error(errosDosCampos(erro)?.grupo ?? 'Não foi possível excluir o grupo.'),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Grupos de acesso</h1>
        <p class="text-muted-foreground">
          Monte grupos com as telas que cada equipe precisa. Os grupos valem só nesta prefeitura.
        </p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Novo grupo
      </Button>
    </div>

    <Listagem
      chave="grupos"
      :itens="grupos.data.value"
      :carregando="grupos.isPending.value"
      :erro="grupos.isError.value"
      :colunas="colunas"
      :identificador="(grupo) => grupo.id"
      placeholder="Buscar por nome…"
      :vazio="{
        titulo: 'Nenhum grupo',
        descricao: 'Cadastre o primeiro em “Novo grupo”.',
        icone: LockKeyhole,
      }"
    >
      <template #coluna-nome="{ item }">
        {{ item.nome }}
        <Badge v-if="item.sistema" variant="outline" class="ml-2">Sistema</Badge>
      </template>
      <template #coluna-telas="{ item }">
        <Badge variant="secondary">{{ item.telas.length }}</Badge>
      </template>
      <template #coluna-acoes="{ item }">
        <!-- O grupo do sistema tem acesso a tudo e não é alterado por aqui. -->
        <span v-if="item.sistema" class="text-xs text-muted-foreground">Acesso total</span>
        <template v-else>
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
      </template>
    </Listagem>

    <FormularioDeGrupo v-if="cadastrando" @fechar="cadastrando = false" />
    <FormularioDeGrupo v-if="emEdicao" :grupo="emEdicao" @fechar="emEdicao = null" />
    <DialogoDeConfirmacao
      :aberto="excluindo !== null"
      titulo="Excluir grupo"
      rotulo-do-botao="Excluir"
      :processando="remover.isPending.value"
      @confirmar="excluir"
      @fechar="excluindo = null"
    >
      O grupo {{ excluindo?.nome }} deixa de existir nesta prefeitura. Grupos em uso por algum
      usuário não podem ser excluídos.
    </DialogoDeConfirmacao>
  </div>
</template>
