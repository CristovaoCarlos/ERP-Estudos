<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import ConteudoDoFormulario from '@/components/ConteudoDoFormulario.vue'
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
import { Spinner } from '@/components/ui/spinner'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'
import { errosDosCampos } from '@/lib/empresas'
import { useFormulario } from '@/lib/formularios'
import { useGrupos } from '@/lib/grupos'
import { useAlterarUsuario, useCadastrarUsuario, type UsuarioDaPrefeitura } from '@/lib/usuarios'

/** `usuario` ausente: cadastro. Presente: alteração. */
const props = defineProps<{ usuario?: UsuarioDaPrefeitura }>()
const emit = defineEmits<{ fechar: [] }>()

const SENHA_MINIMA = 8
const mensagemDaSenha = `A senha deve ter ao menos ${SENHA_MINIMA} caracteres.`

const esquema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(150, 'Use no máximo 150 caracteres.'),
  cpf: props.usuario
    ? z.string().optional()
    : z.string().refine(cpfValido, 'Informe um CPF válido.'),
  email: z.email('Informe um e-mail válido.').max(150, 'Use no máximo 150 caracteres.'),
  password: props.usuario
    ? z.string().refine((senha) => senha === '' || senha.length >= SENHA_MINIMA, mensagemDaSenha)
    : z.string().min(SENHA_MINIMA, mensagemDaSenha),
})

const grupos = useGrupos()
const cadastrar = useCadastrarUsuario()
const alterar = useAlterarUsuario(props.usuario?.id ?? 0)
const salvando = computed(() => (props.usuario ? alterar : cadastrar).isPending.value)
const somenteGrupos = props.usuario?.somente_grupos ?? false
const selecionados = ref<string[]>(props.usuario?.grupos ?? [])

const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  name: props.usuario?.name ?? '',
  cpf: props.usuario?.cpf ? formatarCpf(props.usuario.cpf) : '',
  email: props.usuario?.email ?? '',
  password: '',
})
const [nome] = campo('name')
const [cpf] = campo('cpf')
const [email] = campo('email')
const [senha] = campo('password')

function alternarGrupo(nome: string, marcado: boolean) {
  selecionados.value = marcado
    ? [...selecionados.value, nome]
    : selecionados.value.filter((atual) => atual !== nome)
}

function aoErrar(erro: unknown) {
  for (const [nome, mensagem] of Object.entries(errosDosCampos(erro) ?? {})) {
    if (['name', 'cpf', 'email', 'password'].includes(nome)) {
      setFieldError(nome as 'name' | 'cpf' | 'email' | 'password', mensagem)
    } else {
      toast.error(mensagem)
    }
  }
}

const salvar = handleSubmit((dados) => {
  const comum = {
    name: dados.name,
    email: dados.email,
    ...(dados.password ? { password: dados.password } : {}),
  }

  if (props.usuario) {
    alterar.mutate(comum, {
      onSuccess: () => {
        toast.success('Usuário alterado.')
        emit('fechar')
      },
      onError: aoErrar,
    })
    return
  }

  cadastrar.mutate(
    {
      ...comum,
      cpf: somenteDigitos(dados.cpf ?? ''),
      password: dados.password,
      grupos: selecionados.value,
    },
    {
      onSuccess: (novo) => {
        toast.success(
          novo.vinculado
            ? `${novo.name} já tinha cadastro no ERP para Estudos e agora tem acesso a esta prefeitura. O nome e a senha atuais foram mantidos.`
            : 'Usuário cadastrado.',
        )
        emit('fechar')
      },
      onError: aoErrar,
    },
  )
})
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <ConteudoDoFormulario chave="usuario">
      <DialogHeader>
        <DialogTitle>{{ usuario ? 'Alterar usuário' : 'Novo usuário' }}</DialogTitle>
        <DialogDescription>
          <template v-if="somenteGrupos">
            Este usuário também trabalha em outra prefeitura: nome, e-mail e senha são dele, e só
            mudam onde foi cadastrado. Use “Editar vínculos” para os grupos.
          </template>
          <template v-else-if="usuario">Os grupos ficam em “Editar vínculos”.</template>
          <template v-else>Os grupos valem só nesta prefeitura.</template>
        </DialogDescription>
      </DialogHeader>
      <form id="form-usuario" novalidate @submit="salvar">
        <FieldGroup>
          <Field :data-invalid="errors.name ? true : undefined">
            <FieldLabel for="name">Nome</FieldLabel>
            <Input
              id="name"
              v-model="nome"
              :disabled="somenteGrupos"
              :aria-invalid="errors.name ? true : undefined"
            />
            <FieldError :errors="[errors.name]" />
          </Field>
          <Field v-if="!usuario" :data-invalid="errors.cpf ? true : undefined">
            <FieldLabel for="cpf">CPF</FieldLabel>
            <Input
              id="cpf"
              :model-value="cpf"
              inputmode="numeric"
              placeholder="000.000.000-00"
              maxlength="14"
              autocomplete="off"
              :aria-invalid="errors.cpf ? true : undefined"
              @update:model-value="(valor) => (cpf = formatarCpf(String(valor)))"
            />
            <FieldError v-if="errors.cpf" :errors="[errors.cpf]" />
            <FieldDescription v-else>
              É o login. Se o CPF já existir no ERP para Estudos, o usuário passa a ter acesso a
              esta prefeitura, mantendo nome e senha.
            </FieldDescription>
          </Field>
          <Field :data-invalid="errors.email ? true : undefined">
            <FieldLabel for="email">E-mail</FieldLabel>
            <Input
              id="email"
              v-model="email"
              type="email"
              autocomplete="off"
              :disabled="somenteGrupos"
              :aria-invalid="errors.email ? true : undefined"
            />
            <FieldError :errors="[errors.email]" />
          </Field>
          <Field :data-invalid="errors.password ? true : undefined">
            <FieldLabel for="password">Senha</FieldLabel>
            <Input
              id="password"
              v-model="senha"
              type="password"
              autocomplete="new-password"
              :disabled="somenteGrupos"
              :aria-invalid="errors.password ? true : undefined"
            />
            <FieldError v-if="errors.password" :errors="[errors.password]" />
            <FieldDescription v-else-if="usuario">
              Deixe em branco para manter a atual.
            </FieldDescription>
          </Field>
          <Field v-if="!usuario">
            <FieldLabel for="grupos">Grupos de acesso</FieldLabel>
            <div id="grupos" class="flex flex-col gap-3">
              <FieldDescription v-if="grupos.data.value?.length === 0">
                Esta prefeitura ainda não tem grupos.
              </FieldDescription>
              <label
                v-for="grupo in grupos.data.value"
                :key="grupo.id"
                class="flex items-center gap-2 text-sm"
              >
                <Checkbox
                  :model-value="selecionados.includes(grupo.nome)"
                  @update:model-value="(marcado) => alternarGrupo(grupo.nome, marcado === true)"
                />
                {{ grupo.nome }}
              </label>
            </div>
            <FieldDescription>
              Sem grupo, o usuário entra na prefeitura mas vê apenas o Início. Depois, use “Editar
              vínculos”.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="form-usuario" :disabled="salvando">
          <Spinner v-if="salvando" data-icon="inline-start" />
          {{ usuario ? 'Salvar' : 'Cadastrar' }}
        </Button>
      </DialogFooter>
    </ConteudoDoFormulario>
  </Dialog>
</template>
