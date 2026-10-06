<script setup lang="ts">
import { CircleAlert, Plus } from '@lucide/vue'
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import ConteudoDoFormulario from '@/components/ConteudoDoFormulario.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Spinner } from '@/components/ui/spinner'
import { cnpjValido, formatarCnpj, normalizarCnpj } from '@/lib/cnpj'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'
import { errosDosCampos, useCadastrarEmpresa } from '@/lib/empresas'
import { useFormulario } from '@/lib/formularios'
import { DOMINIO_CENTRAL } from '@/lib/prefeitura'

const esquema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(150, 'Use no máximo 150 caracteres.'),
  cnpj: z.string().refine(cnpjValido, 'Informe um CNPJ válido.'),
  subdominio: z
    .string()
    .trim()
    .toLowerCase()
    .min(1, 'Informe o endereço.')
    .max(40, 'Use no máximo 40 caracteres.')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use apenas letras minúsculas, números e hífen.'),
  administrador: z.object({
    cpf: z.string().refine(cpfValido, 'Informe um CPF válido.'),
    email: z.email('Informe um e-mail válido.').max(150, 'Use no máximo 150 caracteres.'),
    senha: z.string().min(8, 'A senha deve ter ao menos 8 caracteres.'),
  }),
})

const vazio = {
  nome: '',
  cnpj: '',
  subdominio: '',
  administrador: { cpf: '', email: '', senha: '' },
}

const aberto = ref(false)
const cadastrar = useCadastrarEmpresa()
const { campo, errors, handleSubmit, resetForm, setFieldError } = useFormulario(esquema, vazio)
const [nome] = campo('nome')
const [cnpj] = campo('cnpj')
const [subdominio] = campo('subdominio')
const [cpf] = campo('administrador.cpf')
const [email] = campo('administrador.email')
const [senha] = campo('administrador.senha')

/** Usuário que será criado (`admin_<subdominio>`), só para mostrar no formulário. */
const usuarioAdministrador = computed(() =>
  String(subdominio.value ?? '')
    .trim()
    .toLowerCase()
    .replace(/-/g, '_'),
)

const erroGeral = computed(() => cadastrar.isError.value && !errosDosCampos(cadastrar.error.value))

function abrirOuFechar(abrir: boolean) {
  aberto.value = abrir
  if (!abrir) {
    resetForm({ values: vazio })
    cadastrar.reset()
  }
}

const salvar = handleSubmit((dados) =>
  cadastrar.mutate(
    {
      ...dados,
      cnpj: normalizarCnpj(dados.cnpj),
      administrador: { ...dados.administrador, cpf: somenteDigitos(dados.administrador.cpf) },
    },
    {
      onSuccess: (empresa) => {
        toast.success(
          `${empresa.nome} cadastrada. O banco de dados está sendo criado e o administrador já pode entrar.`,
        )
        abrirOuFechar(false)
      },
      onError: (erro) => {
        for (const [nome, mensagem] of Object.entries(errosDosCampos(erro) ?? {})) {
          // `administrador.email` e companhia também são campos do formulário.
          if (nome in esquema.shape || nome.startsWith('administrador.')) {
            setFieldError(nome as never, mensagem)
          }
        }
      },
    },
  ),
)
</script>

<template>
  <Dialog :open="aberto" @update:open="abrirOuFechar">
    <DialogTrigger as-child>
      <Button>
        <Plus data-icon="inline-start" />
        Nova empresa
      </Button>
    </DialogTrigger>
    <ConteudoDoFormulario chave="empresa">
      <DialogHeader>
        <DialogTitle>Nova empresa</DialogTitle>
        <DialogDescription>
          Cria a prefeitura no endereço informado, com banco de dados próprio e os grupos de acesso
          Parâmetros, Tabelas e Lançamentos.
        </DialogDescription>
      </DialogHeader>
      <Alert v-if="erroGeral" variant="destructive">
        <CircleAlert />
        <AlertDescription>Não foi possível cadastrar. Tente novamente.</AlertDescription>
      </Alert>
      <form id="form-empresa" novalidate @submit="salvar">
        <FieldGroup>
          <Field :data-invalid="errors.nome ? true : undefined">
            <FieldLabel for="nome">Nome</FieldLabel>
            <Input
              id="nome"
              v-model="nome"
              placeholder="Prefeitura Municipal de …"
              :aria-invalid="errors.nome ? true : undefined"
            />
            <FieldError :errors="[errors.nome]" />
          </Field>
          <Field :data-invalid="errors.cnpj ? true : undefined">
            <FieldLabel for="cnpj">CNPJ</FieldLabel>
            <Input
              id="cnpj"
              :model-value="cnpj"
              placeholder="00.000.000/0000-00"
              maxlength="18"
              autocomplete="off"
              :aria-invalid="errors.cnpj ? true : undefined"
              @update:model-value="(valor) => (cnpj = formatarCnpj(String(valor)))"
            />
            <FieldError :errors="[errors.cnpj]" />
          </Field>
          <Field :data-invalid="errors.subdominio ? true : undefined">
            <FieldLabel for="subdominio">Endereço</FieldLabel>
            <InputGroup>
              <InputGroupInput
                id="subdominio"
                v-model="subdominio"
                placeholder="nome-do-municipio"
                autocomplete="off"
                autocapitalize="none"
                spellcheck="false"
                :aria-invalid="errors.subdominio ? true : undefined"
              />
              <InputGroupAddon align="inline-end">
                <InputGroupText>.{{ DOMINIO_CENTRAL }}</InputGroupText>
              </InputGroupAddon>
            </InputGroup>
            <FieldError v-if="errors.subdominio" :errors="[errors.subdominio]" />
            <FieldDescription v-else>
              É o endereço que você vai repassar aos usuários da prefeitura. Não pode ser alterado
              depois.
            </FieldDescription>
          </Field>
          <Field>
            <FieldLabel for="administrador-cpf">Administrador da prefeitura</FieldLabel>
            <FieldDescription>
              Cria o usuário <span class="font-mono">admin_{{ usuarioAdministrador || '…' }}</span
              >, no grupo Administrador, com acesso a todas as telas. Se o CPF já existir no ERP
              para Estudos, o usuário atual é aproveitado.
            </FieldDescription>
          </Field>
          <Field :data-invalid="errors['administrador.cpf'] ? true : undefined">
            <FieldLabel for="administrador-cpf">CPF</FieldLabel>
            <Input
              id="administrador-cpf"
              :model-value="cpf"
              inputmode="numeric"
              placeholder="000.000.000-00"
              maxlength="14"
              autocomplete="off"
              :aria-invalid="errors['administrador.cpf'] ? true : undefined"
              @update:model-value="(valor) => (cpf = formatarCpf(String(valor)))"
            />
            <FieldError :errors="[errors['administrador.cpf']]" />
          </Field>
          <Field :data-invalid="errors['administrador.email'] ? true : undefined">
            <FieldLabel for="administrador-email">E-mail</FieldLabel>
            <Input
              id="administrador-email"
              v-model="email"
              type="email"
              autocomplete="off"
              :aria-invalid="errors['administrador.email'] ? true : undefined"
            />
            <FieldError :errors="[errors['administrador.email']]" />
          </Field>
          <Field :data-invalid="errors['administrador.senha'] ? true : undefined">
            <FieldLabel for="administrador-senha">Senha inicial</FieldLabel>
            <Input
              id="administrador-senha"
              v-model="senha"
              type="password"
              autocomplete="new-password"
              :aria-invalid="errors['administrador.senha'] ? true : undefined"
            />
            <FieldError
              v-if="errors['administrador.senha']"
              :errors="[errors['administrador.senha']]"
            />
            <FieldDescription v-else>
              Ao menos 8 caracteres. Ele pode trocar depois em Minha conta.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="form-empresa" :disabled="cadastrar.isPending.value">
          <Spinner v-if="cadastrar.isPending.value" data-icon="inline-start" />
          Cadastrar
        </Button>
      </DialogFooter>
    </ConteudoDoFormulario>
  </Dialog>
</template>
