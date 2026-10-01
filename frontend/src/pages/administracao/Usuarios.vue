<script setup lang="ts">
import { Pencil, Plus, Power, PowerOff, Trash2, Users, UsersRound } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'

import DialogoDeConfirmacao from '@/components/DialogoDeConfirmacao.vue'
import ItemDeFiltro from '@/components/ItemDeFiltro.vue'
import Listagem from '@/components/Listagem.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useUsuario } from '@/lib/auth'
import { formatarCpf } from '@/lib/cpf'
import { errosDosCampos } from '@/lib/empresas'
import { useSelecao, type Coluna } from '@/lib/listagem'
import {
  useAlterarStatus,
  useRemoverUsuario,
  useUsuariosDaPrefeitura,
  type UsuarioDaPrefeitura,
} from '@/lib/usuarios'
import EditarVinculos from '@/pages/administracao/usuarios/EditarVinculos.vue'
import FormularioDeUsuario from '@/pages/administracao/usuarios/FormularioDeUsuario.vue'

const colunas: Coluna<UsuarioDaPrefeitura>[] = [
  { id: 'nome', titulo: 'Nome', className: 'font-medium', busca: (usuario) => usuario.name },
  {
    id: 'cpf',
    titulo: 'CPF',
    className: 'font-mono text-xs',
    valor: (usuario) => (usuario.cpf ? formatarCpf(usuario.cpf) : '—'),
    busca: (usuario) => (usuario.cpf ? `${usuario.cpf} ${formatarCpf(usuario.cpf)}` : ''),
  },
  {
    id: 'email',
    titulo: 'E-mail',
    className: 'text-muted-foreground',
    valor: (usuario) => usuario.email,
    busca: (usuario) => usuario.email,
  },
  { id: 'grupos', titulo: 'Grupos', busca: (usuario) => usuario.grupos.join(' ') },
  { id: 'situacao', titulo: 'Situação' },
  { id: 'acoes', titulo: 'Ações', fixa: true, className: 'w-40 text-right whitespace-nowrap' },
]

const situacoes = [
  { valor: 'ativo', rotulo: 'Ativos' },
  { valor: 'inativo', rotulo: 'Inativos' },
] as const

const usuarios = useUsuariosDaPrefeitura()
const eu = useUsuario()
const status = useAlterarStatus()
const remover = useRemoverUsuario()
const emEdicao = ref<UsuarioDaPrefeitura | null>(null)
const cadastrando = ref(false)
const removendo = ref<UsuarioDaPrefeitura | null>(null)
const desativando = ref<UsuarioDaPrefeitura | null>(null)
const emVinculos = ref<UsuarioDaPrefeitura | null>(null)
const filtro = useSelecao<'ativo' | 'inativo'>()

const filtrados = computed(() =>
  filtro.selecionados.value.length
    ? usuarios.data.value?.filter((usuario) =>
        filtro.selecionados.value.includes(usuario.ativo ? 'ativo' : 'inativo'),
      )
    : usuarios.data.value,
)

function alternarStatus(usuario: UsuarioDaPrefeitura) {
  if (usuario.ativo) {
    desativando.value = usuario
    return
  }
  status.mutate(
    { id: usuario.id, ativo: true },
    {
      onSuccess: () => toast.success(`Acesso de ${usuario.name} ativado.`),
      onError: () => toast.error('Não foi possível ativar o acesso.'),
    },
  )
}

function desativar() {
  const usuario = desativando.value
  if (!usuario) return
  status.mutate(
    { id: usuario.id, ativo: false },
    {
      onSuccess: () => {
        toast.success(`Acesso de ${usuario.name} desativado.`)
        desativando.value = null
      },
      onError: (erro) =>
        toast.error(errosDosCampos(erro)?.usuario ?? 'Não foi possível desativar o acesso.'),
    },
  )
}

function removerAcesso() {
  const usuario = removendo.value
  if (!usuario) return
  remover.mutate(usuario.id, {
    onSuccess: () => {
      toast.success(`${usuario.name} não tem mais acesso a esta prefeitura.`)
      removendo.value = null
    },
    onError: (erro) =>
      toast.error(errosDosCampos(erro)?.usuario ?? 'Não foi possível remover o acesso.'),
  })
}
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">Usuários</h1>
        <p class="text-muted-foreground">
          Quem tem acesso a esta prefeitura e o que cada um pode abrir.
        </p>
      </div>
      <Button @click="cadastrando = true">
        <Plus data-icon="inline-start" />
        Novo usuário
      </Button>
    </div>

    <Listagem
      chave="usuarios"
      :itens="filtrados"
      :carregando="usuarios.isPending.value"
      :erro="usuarios.isError.value"
      :colunas="colunas"
      :identificador="(usuario) => usuario.id"
      placeholder="Buscar por nome, CPF, e-mail ou grupo…"
      :filtros-ativos="filtro.selecionados.value.length"
      :destacar="(usuario) => (usuario.ativo ? undefined : 'opacity-60')"
      :vazio="{
        titulo: 'Nenhum usuário',
        descricao: 'Cadastre o primeiro em “Novo usuário”.',
        icone: Users,
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
      <template #coluna-nome="{ item }">
        {{ item.name }}
        <Badge v-if="item.superadmin" variant="outline" class="ml-2">Superadmin</Badge>
      </template>
      <template #coluna-grupos="{ item }">
        <div class="flex flex-wrap gap-1">
          <span v-if="item.grupos.length === 0" class="text-muted-foreground">—</span>
          <Badge v-for="grupo in item.grupos" v-else :key="grupo" variant="secondary">
            {{ grupo }}
          </Badge>
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
          :aria-label="`Alterar ${item.name}`"
          @click="emEdicao = item"
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`Editar vínculos de ${item.name}`"
          title="Editar vínculos"
          @click="emVinculos = item"
        >
          <UsersRound />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`${item.ativo ? 'Desativar' : 'Ativar'} ${item.name}`"
          :disabled="item.id === eu.data.value?.id || status.isPending.value"
          @click="alternarStatus(item)"
        >
          <PowerOff v-if="item.ativo" />
          <Power v-else />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          :aria-label="`Remover ${item.name}`"
          :disabled="item.id === eu.data.value?.id"
          @click="removendo = item"
        >
          <Trash2 />
        </Button>
      </template>
    </Listagem>

    <FormularioDeUsuario v-if="cadastrando" @fechar="cadastrando = false" />
    <FormularioDeUsuario v-if="emEdicao" :usuario="emEdicao" @fechar="emEdicao = null" />
    <EditarVinculos v-if="emVinculos" :usuario="emVinculos" @fechar="emVinculos = null" />
    <DialogoDeConfirmacao
      :aberto="desativando !== null"
      titulo="Desativar acesso"
      rotulo-do-botao="Desativar acesso"
      :processando="status.isPending.value"
      @confirmar="desativar"
      @fechar="desativando = null"
    >
      {{ desativando?.name }} deixa de entrar nesta prefeitura e as sessões abertas aqui são
      encerradas. O cadastro e os grupos são mantidos, e o acesso pode ser reativado a qualquer
      momento.
    </DialogoDeConfirmacao>
    <DialogoDeConfirmacao
      :aberto="removendo !== null"
      titulo="Remover acesso"
      rotulo-do-botao="Remover acesso"
      :processando="remover.isPending.value"
      @confirmar="removerAcesso"
      @fechar="removendo = null"
    >
      {{ removendo?.name }} perde o acesso a esta prefeitura e as sessões abertas dele aqui são
      encerradas. O cadastro continua no ERP para Estudos, nas outras prefeituras em que ele
      trabalha.
    </DialogoDeConfirmacao>
  </div>
</template>
