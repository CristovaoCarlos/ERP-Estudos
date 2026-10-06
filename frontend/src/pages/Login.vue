<script setup lang="ts">
import { ArrowLeft, CircleAlert, Clock } from '@lucide/vue'
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { z } from 'zod'

import PaginaDeAcesso from '@/components/PaginaDeAcesso.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { getToken } from '@/lib/api'
import { mensagemDeErroDoLogin, useLogin } from '@/lib/auth'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'
import { useFormulario } from '@/lib/formularios'

const esquema = z.object({
  cpf: z.string().refine(cpfValido, 'Informe um CPF válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

const route = useRoute()
const router = useRouter()
const login = useLogin()

/** Por que a sessão anterior acabou (ver `RotaProtegida` e o interceptor de 401 em `lib/api.ts`). */
const avisoDeSessao = computed(() => {
  if (route.query.sessao === 'inatividade') return 'Sua sessão foi encerrada por inatividade.'
  if (route.query.sessao === 'expirada') return 'Sua sessão expirou. Entre novamente.'
  return null
})
const { campo, errors, handleSubmit } = useFormulario(esquema, { cpf: '', password: '' })
const [cpf] = campo('cpf')
const [password] = campo('password')

// Quem já entrou não vê o login de novo.
watchEffect(() => {
  if (getToken() !== null && !login.isSuccess.value) router.replace('/')
})

/** Tela que pediu o login (ver `RotaProtegida`) ou a página inicial. */
const destino = (router.options.history.state as { de?: string } | null)?.de ?? '/'

const entrar = handleSubmit(({ cpf, password }) =>
  login.mutate(
    { cpf: somenteDigitos(cpf), password },
    { onSuccess: () => router.replace(destino) },
  ),
)
</script>

<template>
  <PaginaDeAcesso titulo="Entrar" descricao="Acesse com o CPF cadastrado na sua prefeitura.">
    <Alert v-if="login.isError.value" variant="destructive">
      <CircleAlert />
      <AlertDescription>{{ mensagemDeErroDoLogin(login.error.value) }}</AlertDescription>
    </Alert>
    <Alert v-else-if="avisoDeSessao">
      <Clock />
      <AlertDescription>{{ avisoDeSessao }}</AlertDescription>
    </Alert>

    <form novalidate class="flex flex-col gap-6" @submit="entrar">
      <FieldGroup>
        <Field :data-invalid="errors.cpf ? true : undefined">
          <FieldLabel for="cpf">CPF</FieldLabel>
          <Input
            id="cpf"
            :model-value="cpf"
            inputmode="numeric"
            autocomplete="username"
            placeholder="000.000.000-00"
            maxlength="14"
            autofocus
            class="h-10 bg-background"
            :aria-invalid="errors.cpf ? true : undefined"
            @update:model-value="(valor) => (cpf = formatarCpf(String(valor)))"
          />
          <FieldError :errors="[errors.cpf]" />
        </Field>
        <Field :data-invalid="errors.password ? true : undefined">
          <div class="flex items-center justify-between gap-2">
            <FieldLabel for="password">Senha</FieldLabel>
            <RouterLink
              to="/esqueci-senha"
              class="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Esqueci minha senha
            </RouterLink>
          </div>
          <Input
            id="password"
            v-model="password"
            type="password"
            autocomplete="current-password"
            class="h-10 bg-background"
            :aria-invalid="errors.password ? true : undefined"
          />
          <FieldError :errors="[errors.password]" />
        </Field>
      </FieldGroup>
      <Button
        type="submit"
        size="lg"
        class="w-full bg-marca text-marca-foreground hover:bg-marca/90"
        :disabled="login.isPending.value"
      >
        <Spinner v-if="login.isPending.value" data-icon="inline-start" />
        Entrar
      </Button>
    </form>

    <RouterLink
      to="/"
      class="flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      <ArrowLeft class="size-3.5" />
      Voltar para a página inicial
    </RouterLink>
  </PaginaDeAcesso>
</template>
