<script setup lang="ts">
import { toast } from 'vue-sonner'
import { z } from 'zod'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useCadastrarItemLcp116 } from '@/lib/administracao-tabelas-comuns-lista-de-servicos'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import { descricao as esquemaDaDescricao } from '@/pages/administracao/tabelas-comuns/lista-de-servicos/esquema'

const emit = defineEmits<{ fechar: [] }>()

const esquema = z.object({
  codigo: z
    .string()
    .trim()
    .regex(/^\d{2}(\.\d{2})?$/, 'Use 01 para item ou 01.01 para subitem.'),
  descricao: esquemaDaDescricao,
})

const cadastrar = useCadastrarItemLcp116()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  codigo: '',
  descricao: '',
})
const [codigo] = campo('codigo')
const [descricao] = campo('descricao')

const salvar = handleSubmit((dados) =>
  cadastrar.mutate(dados, {
    onSuccess: () => {
      toast.success(`Item ${dados.codigo} cadastrado.`)
      emit('fechar')
    },
    onError: (erro) =>
      mostrarErrosDoServidor(
        erro,
        setFieldError,
        ['codigo', 'descricao'],
        'Não foi possível cadastrar o item.',
      ),
  }),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-novo-item"
    titulo="Novo item ou subitem"
    descricao="A lista de serviços é a mesma para todas as prefeituras: o item cadastrado vale para todas."
    :salvando="cadastrar.isPending.value"
    largo
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field :data-invalid="errors.codigo ? true : undefined">
      <FieldLabel for="novo-codigo">Código</FieldLabel>
      <Input
        id="novo-codigo"
        v-model="codigo"
        maxlength="5"
        placeholder="01.01"
        class="w-32 font-mono"
        :aria-invalid="errors.codigo ? true : undefined"
      />
      <FieldDescription>
        Dois dígitos para item (01) ou item e subitem (01.01). O subitem exige o item cadastrado.
      </FieldDescription>
      <FieldError :errors="[errors.codigo]" />
    </Field>
    <Field :data-invalid="errors.descricao ? true : undefined">
      <FieldLabel for="nova-descricao">Descrição</FieldLabel>
      <Textarea
        id="nova-descricao"
        v-model="descricao"
        rows="6"
        :aria-invalid="errors.descricao ? true : undefined"
      />
      <FieldError :errors="[errors.descricao]" />
    </Field>
  </DialogoDeCadastro>
</template>
