<script setup lang="ts">
import { toast } from 'vue-sonner'
import { z } from 'zod'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCadastrarDamTipo } from '@/lib/administracao-tabelas-comuns-tipos-de-dam'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'

const emit = defineEmits<{ fechar: [] }>()

const esquema = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^[1-9]\d{0,3}$/, 'Use um código de 1 a 9999.'),
  descricao: z
    .string()
    .trim()
    .min(1, 'Informe a descrição.')
    .max(20, 'Use no máximo 20 caracteres.'),
})

const cadastrar = useCadastrarDamTipo()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  codigo: '',
  descricao: '',
})
const [codigo] = campo('codigo')
const [descricao] = campo('descricao')

const salvar = handleSubmit(({ codigo, descricao }) =>
  cadastrar.mutate(
    { codigo: Number(codigo), descricao },
    {
      onSuccess: () => {
        toast.success('Tipo de DAM cadastrado.')
        emit('fechar')
      },
      onError: (erro) =>
        mostrarErrosDoServidor(
          erro,
          setFieldError,
          ['codigo', 'descricao'],
          'Não foi possível cadastrar o tipo de DAM.',
        ),
    },
  ),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-tipo-de-dam"
    titulo="Novo tipo de DAM"
    descricao="Os tipos de DAM são os mesmos para todas as prefeituras: o novo tipo vale para todas."
    :salvando="cadastrar.isPending.value"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field :data-invalid="errors.codigo ? true : undefined">
      <FieldLabel for="codigo">Código</FieldLabel>
      <Input
        id="codigo"
        v-model="codigo"
        inputmode="numeric"
        maxlength="4"
        placeholder="8"
        class="w-24 font-mono"
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
        placeholder="MULTAS"
        :aria-invalid="errors.descricao ? true : undefined"
      />
      <FieldError :errors="[errors.descricao]" />
    </Field>
  </DialogoDeCadastro>
</template>
