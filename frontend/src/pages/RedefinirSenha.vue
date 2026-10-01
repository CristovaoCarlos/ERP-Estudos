<script setup lang="ts">
import { CircleAlert } from '@lucide/vue'
import { useRoute, useRouter } from 'vue-router'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import PaginaDeAcesso from '@/components/PaginaDeAcesso.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { formatarCpf } from '@/lib/cpf'
import { useFormulario } from '@/lib/formularios'
import { mensagemDeErroDaSenha, useRedefinirSenha } from '@/lib/senha'

const SENHA_MINIMA = 8

const esquema = z
  .object({
    password: z.string().min(SENHA_MINIMA, `A senha deve ter ao menos ${SENHA_MINIMA} caracteres.`),
    password_confirmation: z.string(),
  })
  .refine((campos) => campos.password === campos.password_confirmation, {
    path: ['password_confirmation'],
    message: 'As senhas não conferem.',
  })

const route = useRoute()
const router = useRouter()
const redefinir = useRedefinirSenha()
const token = String(route.query.token ?? '')
const cpf = String(route.query.cpf ?? '')
const { campo, errors, handleSubmit } = useFormulario(esquema, {
  password: '',
  password_confirmation: '',
})
const [password] = campo('password')
const [confirmacao] = campo('password_confirmation')

// Sem token no endereço não há o que redefinir.
if (!token || !cpf) router.replace('/esqueci-senha')

const salvar = handleSubmit((campos) =>
  redefinir.mutate(
    { ...campos, cpf, token },
    {
      onSuccess: ({ message }) => {
        toast.success(message)
        router.replace('/login')
      },
    },
  ),
)
</script>

<template>
  <PaginaDeAcesso
    v-if="token && cpf"
    titulo="Nova senha"
    :descricao="`Escolha a nova senha do CPF ${formatarCpf(cpf)}.`"
  >
    <Alert v-if="redefinir.isError.value" variant="destructive">
      <CircleAlert />
      <AlertDescription>{{ mensagemDeErroDaSenha(redefinir.error.value) }}</AlertDescription>
    </Alert>
    <form novalidate class="flex flex-col gap-6" @submit="salvar">
      <FieldGroup>
        <Field :data-invalid="errors.password ? true : undefined">
          <FieldLabel for="password">Nova senha</FieldLabel>
          <Input
            id="password"
            v-model="password"
            type="password"
            autocomplete="new-password"
            autofocus
            class="h-10 bg-background"
            :aria-invalid="errors.password ? true : undefined"
          />
          <FieldError v-if="errors.password" :errors="[errors.password]" />
          <FieldDescription v-else>Ao menos {{ SENHA_MINIMA }} caracteres.</FieldDescription>
        </Field>
        <Field :data-invalid="errors.password_confirmation ? true : undefined">
          <FieldLabel for="password_confirmation">Repita a nova senha</FieldLabel>
          <Input
            id="password_confirmation"
            v-model="confirmacao"
            type="password"
            autocomplete="new-password"
            class="h-10 bg-background"
            :aria-invalid="errors.password_confirmation ? true : undefined"
          />
          <FieldError :errors="[errors.password_confirmation]" />
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" class="w-full" :disabled="redefinir.isPending.value">
        <Spinner v-if="redefinir.isPending.value" data-icon="inline-start" />
        Salvar senha
      </Button>
    </form>
    <RouterLink
      to="/esqueci-senha"
      class="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Pedir um link novo
    </RouterLink>
  </PaginaDeAcesso>
</template>
