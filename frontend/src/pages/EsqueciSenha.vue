<script setup lang="ts">
import { CircleAlert, MailCheck } from '@lucide/vue'
import { z } from 'zod'

import PaginaDeAcesso from '@/components/PaginaDeAcesso.vue'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'
import { useFormulario } from '@/lib/formularios'
import { mensagemDeErroDaSenha, usePedirRecuperacao } from '@/lib/senha'

const esquema = z.object({
  cpf: z.string().refine(cpfValido, 'Informe um CPF válido.'),
})

const pedir = usePedirRecuperacao()
const { campo, errors, handleSubmit } = useFormulario(esquema, { cpf: '' })
const [cpf] = campo('cpf')

const enviar = handleSubmit(({ cpf }) => pedir.mutate(somenteDigitos(cpf)))
</script>

<template>
  <PaginaDeAcesso
    v-if="pedir.isSuccess.value"
    titulo="Confira o seu e-mail"
    :descricao="pedir.data.value?.message ?? ''"
  >
    <Alert>
      <MailCheck />
      <AlertDescription>
        O link vale por 60 minutos e só pode ser usado uma vez. Se o e-mail não chegar, confira a
        caixa de spam ou fale com o administrador da sua prefeitura.
      </AlertDescription>
    </Alert>
    <Button as-child variant="outline" class="w-full">
      <RouterLink to="/login">Voltar para o login</RouterLink>
    </Button>
  </PaginaDeAcesso>

  <PaginaDeAcesso
    v-else
    titulo="Esqueci minha senha"
    descricao="Informe o CPF do seu acesso. Enviamos um link para o e-mail cadastrado."
  >
    <Alert v-if="pedir.isError.value" variant="destructive">
      <CircleAlert />
      <AlertDescription>{{ mensagemDeErroDaSenha(pedir.error.value) }}</AlertDescription>
    </Alert>
    <form novalidate class="flex flex-col gap-6" @submit="enviar">
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
          <FieldError v-if="errors.cpf" :errors="[errors.cpf]" />
          <FieldDescription v-else>
            O e-mail é o que está no seu cadastro nesta prefeitura.
          </FieldDescription>
        </Field>
      </FieldGroup>
      <Button type="submit" size="lg" class="w-full" :disabled="pedir.isPending.value">
        <Spinner v-if="pedir.isPending.value" data-icon="inline-start" />
        Enviar link
      </Button>
    </form>
    <RouterLink
      to="/login"
      class="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
    >
      Voltar para o login
    </RouterLink>
  </PaginaDeAcesso>
</template>
