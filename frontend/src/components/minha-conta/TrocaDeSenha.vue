<script setup lang="ts">
import { useMutation } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import Obrigatorio from '@/components/Obrigatorio.vue'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { errosDosCampos } from '@/lib/empresas'
import { useFormulario } from '@/lib/formularios'

const emit = defineEmits<{ fechar: [] }>()

const SENHA_MINIMA = 8

const esquema = z
  .object({
    senha_atual: z.string().min(1, 'Informe a senha atual.'),
    password: z.string().min(SENHA_MINIMA, `Mínimo de ${SENHA_MINIMA} caracteres.`),
    password_confirmation: z.string(),
  })
  .refine((campos) => campos.password === campos.password_confirmation, {
    path: ['password_confirmation'],
    message: 'As senhas não conferem.',
  })

const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  senha_atual: '',
  password: '',
  password_confirmation: '',
})
const [atual] = campo('senha_atual')
const [nova] = campo('password')
const [confirmacao] = campo('password_confirmation')

const trocar = useMutation({
  mutationFn: async (dados: z.infer<typeof esquema>) =>
    (await api.put<{ message: string }>('/me/senha', dados)).data,
  onSuccess: ({ message }) => {
    toast.success(message)
    emit('fechar')
  },
  onError: (erro) => {
    const erros = errosDosCampos(erro)
    if (erros?.senha_atual) setFieldError('senha_atual', erros.senha_atual)
    else if (erros?.password) setFieldError('password', erros.password)
    else toast.error('Não foi possível trocar a senha.')
  },
})

const enviar = handleSubmit((dados) => trocar.mutate(dados))
</script>

<template>
  <form novalidate class="flex flex-col gap-6" @submit="enviar">
    <FieldGroup>
      <Field :data-invalid="errors.senha_atual ? true : undefined">
        <FieldLabel for="senha_atual">Senha atual <Obrigatorio /></FieldLabel>
        <Input
          id="senha_atual"
          v-model="atual"
          type="password"
          autocomplete="current-password"
          :aria-invalid="errors.senha_atual ? true : undefined"
        />
        <FieldError :errors="[errors.senha_atual]" />
      </Field>
      <Field :data-invalid="errors.password ? true : undefined">
        <FieldLabel for="password">Nova senha <Obrigatorio /></FieldLabel>
        <Input
          id="password"
          v-model="nova"
          type="password"
          autocomplete="new-password"
          :placeholder="`Mínimo de ${SENHA_MINIMA} caracteres`"
          :aria-invalid="errors.password ? true : undefined"
        />
        <FieldError v-if="errors.password" :errors="[errors.password]" />
        <FieldDescription v-else>Mínimo de {{ SENHA_MINIMA }} caracteres.</FieldDescription>
      </Field>
      <Field :data-invalid="errors.password_confirmation ? true : undefined">
        <FieldLabel for="password_confirmation">Confirmar nova senha <Obrigatorio /></FieldLabel>
        <Input
          id="password_confirmation"
          v-model="confirmacao"
          type="password"
          autocomplete="new-password"
          placeholder="Repita a nova senha"
          :aria-invalid="errors.password_confirmation ? true : undefined"
        />
        <FieldError :errors="[errors.password_confirmation]" />
      </Field>
    </FieldGroup>
    <p class="text-sm text-muted-foreground">
      Ao trocar a senha, as suas outras sessões são encerradas — esta continua ativa.
    </p>
    <DialogFooter>
      <Button type="button" variant="outline" @click="emit('fechar')">Cancelar</Button>
      <Button type="submit" :disabled="trocar.isPending.value">
        <Spinner v-if="trocar.isPending.value" data-icon="inline-start" />
        Trocar senha
      </Button>
    </DialogFooter>
  </form>
</template>
