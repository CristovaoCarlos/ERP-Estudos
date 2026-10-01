<script setup lang="ts">
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import FotoDoUsuario from '@/components/minha-conta/FotoDoUsuario.vue'
import Obrigatorio from '@/components/Obrigatorio.vue'
import { Button } from '@/components/ui/button'
import { DialogFooter } from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import type { Usuario } from '@/lib/auth'
import { errosDosCampos } from '@/lib/empresas'
import { useFormulario } from '@/lib/formularios'

const props = defineProps<{ usuario: Usuario }>()
const emit = defineEmits<{ fechar: [] }>()

const esquema = z.object({
  name: z.string().trim().min(1, 'Informe o nome.').max(150, 'Use no máximo 150 caracteres.'),
  email: z.email('Informe um e-mail válido.').max(150, 'Use no máximo 150 caracteres.'),
})

const queryClient = useQueryClient()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  name: props.usuario.name,
  email: props.usuario.email,
})
const [nome] = campo('name')
const [email] = campo('email')

const salvar = useMutation({
  mutationFn: async (dados: z.infer<typeof esquema>) => (await api.put<Usuario>('/me', dados)).data,
  onSuccess: (atualizado) => {
    queryClient.setQueryData(['me'], atualizado)
    queryClient.invalidateQueries({ queryKey: ['usuarios'] })
    toast.success('Dados salvos.')
    emit('fechar')
  },
  onError: (erro) => {
    const erros = errosDosCampos(erro)
    if (erros?.email) setFieldError('email', erros.email)
    else if (erros?.name) setFieldError('name', erros.name)
    else toast.error('Não foi possível salvar.')
  },
})

const enviar = handleSubmit((dados) => salvar.mutate(dados))
</script>

<template>
  <form id="form-meus-dados" novalidate class="flex flex-col gap-6" @submit="enviar">
    <FotoDoUsuario :usuario="usuario" />
    <FieldGroup>
      <Field :data-invalid="errors.name ? true : undefined">
        <FieldLabel for="name">Nome <Obrigatorio /></FieldLabel>
        <Input id="name" v-model="nome" :aria-invalid="errors.name ? true : undefined" />
        <FieldError :errors="[errors.name]" />
      </Field>
      <Field :data-invalid="errors.email ? true : undefined">
        <FieldLabel for="email">E-mail <Obrigatorio /></FieldLabel>
        <Input
          id="email"
          v-model="email"
          type="email"
          :aria-invalid="errors.email ? true : undefined"
        />
        <FieldError v-if="errors.email" :errors="[errors.email]" />
        <FieldDescription v-else>Para onde vai o link de recuperação de senha.</FieldDescription>
      </Field>
    </FieldGroup>
    <DialogFooter>
      <Button type="button" variant="outline" @click="emit('fechar')">Cancelar</Button>
      <Button type="submit" :disabled="salvar.isPending.value">
        <Spinner v-if="salvar.isPending.value" data-icon="inline-start" />
        Salvar
      </Button>
    </DialogFooter>
  </form>
</template>
