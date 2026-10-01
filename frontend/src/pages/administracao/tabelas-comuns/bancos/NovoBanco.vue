<script setup lang="ts">
import { toast } from 'vue-sonner'
import { z } from 'zod'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCadastrarBanco } from '@/lib/administracao-tabelas-comuns-bancos'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'

const emit = defineEmits<{ fechar: [] }>()

const esquema = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'O código tem 4 dígitos (com zeros à esquerda, ex.: 0001).'),
  nome: z.string().trim().min(1, 'Informe o nome.').max(100, 'Use no máximo 100 caracteres.'),
})

const cadastrar = useCadastrarBanco()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  codigo: '',
  nome: '',
})
const [codigo] = campo('codigo')
const [nome] = campo('nome')

const salvar = handleSubmit((dados) =>
  cadastrar.mutate(dados, {
    onSuccess: () => {
      toast.success('Banco cadastrado.')
      emit('fechar')
    },
    onError: (erro) =>
      mostrarErrosDoServidor(
        erro,
        setFieldError,
        ['codigo', 'nome'],
        'Não foi possível cadastrar o banco.',
      ),
  }),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-banco"
    titulo="Novo banco"
    descricao="Os bancos são os mesmos para todas as prefeituras: o banco cadastrado vale para todas."
    :salvando="cadastrar.isPending.value"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field :data-invalid="errors.codigo ? true : undefined">
      <FieldLabel for="codigo">Código de compensação</FieldLabel>
      <Input
        id="codigo"
        v-model="codigo"
        inputmode="numeric"
        maxlength="4"
        placeholder="0001"
        class="w-28 font-mono"
        :aria-invalid="errors.codigo ? true : undefined"
      />
      <FieldError :errors="[errors.codigo]" />
    </Field>
    <Field :data-invalid="errors.nome ? true : undefined">
      <FieldLabel for="nome">Nome</FieldLabel>
      <Input
        id="nome"
        v-model="nome"
        maxlength="100"
        placeholder="Banco do Brasil S.A."
        :aria-invalid="errors.nome ? true : undefined"
      />
      <FieldError :errors="[errors.nome]" />
    </Field>
  </DialogoDeCadastro>
</template>
