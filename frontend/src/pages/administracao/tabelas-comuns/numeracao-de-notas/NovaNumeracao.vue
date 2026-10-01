<script setup lang="ts">
import { toast } from 'vue-sonner'
import { z } from 'zod'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCadastrarNotaNumeracao } from '@/lib/administracao-tabelas-comuns-numeracao-de-notas'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'

const emit = defineEmits<{ fechar: [] }>()

const esquema = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^[A-Za-z]$/, 'O código é uma letra.'),
  descricao: z
    .string()
    .trim()
    .min(1, 'Informe a descrição.')
    .max(20, 'Use no máximo 20 caracteres.'),
})

const cadastrar = useCadastrarNotaNumeracao()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  codigo: '',
  descricao: '',
})
const [codigo] = campo('codigo')
const [descricao] = campo('descricao')

const salvar = handleSubmit(({ codigo, descricao }) =>
  cadastrar.mutate(
    { codigo: codigo.toUpperCase(), descricao },
    {
      onSuccess: () => {
        toast.success('Numeração cadastrada.')
        emit('fechar')
      },
      onError: (erro) =>
        mostrarErrosDoServidor(
          erro,
          setFieldError,
          ['codigo', 'descricao'],
          'Não foi possível cadastrar a numeração.',
        ),
    },
  ),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-numeracao"
    titulo="Nova numeração"
    descricao="Os tipos de numeração são os mesmos para todas as prefeituras: o novo tipo vale para todas."
    :salvando="cadastrar.isPending.value"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field :data-invalid="errors.codigo ? true : undefined">
      <FieldLabel for="codigo">Código</FieldLabel>
      <Input
        id="codigo"
        v-model="codigo"
        maxlength="1"
        placeholder="A"
        class="w-20 font-mono uppercase"
        :aria-invalid="errors.codigo ? true : undefined"
      />
      <FieldError :errors="[errors.codigo]" />
    </Field>
    <Field :data-invalid="errors.descricao ? true : undefined">
      <FieldLabel for="descricao">Descrição</FieldLabel>
      <Input
        id="descricao"
        v-model="descricao"
        maxlength="20"
        placeholder="AUTOMÁTICO"
        :aria-invalid="errors.descricao ? true : undefined"
      />
      <FieldError :errors="[errors.descricao]" />
    </Field>
  </DialogoDeCadastro>
</template>
