<script setup lang="ts">
import { toast } from 'vue-sonner'
import { z } from 'zod'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCadastrarSegmento } from '@/lib/administracao-tabelas-comuns-segmentos'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import { descricao as esquemaDaDescricao } from '@/pages/administracao/tabelas-comuns/segmentos/esquema'

const emit = defineEmits<{ fechar: [] }>()

const esquema = z.object({
  codigo: z.string().trim().regex(/^\d$/, 'O código é um dígito, de 0 a 9.'),
  descricao: esquemaDaDescricao,
})

const cadastrar = useCadastrarSegmento()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  codigo: '',
  descricao: '',
})
const [codigo] = campo('codigo')
const [descricao] = campo('descricao')

const salvar = handleSubmit((dados) =>
  cadastrar.mutate(dados, {
    onSuccess: () => {
      toast.success('Segmento cadastrado.')
      emit('fechar')
    },
    onError: (erro) =>
      mostrarErrosDoServidor(
        erro,
        setFieldError,
        ['codigo', 'descricao'],
        'Não foi possível cadastrar o segmento.',
      ),
  }),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-novo-segmento"
    titulo="Novo segmento"
    descricao="Os segmentos são os mesmos para todas as prefeituras: o novo segmento vale para todas."
    :salvando="cadastrar.isPending.value"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field :data-invalid="errors.codigo ? true : undefined">
      <FieldLabel for="novo-codigo">Código</FieldLabel>
      <Input
        id="novo-codigo"
        v-model="codigo"
        inputmode="numeric"
        maxlength="1"
        placeholder="4"
        class="w-20 font-mono"
        :aria-invalid="errors.codigo ? true : undefined"
      />
      <FieldError :errors="[errors.codigo]" />
    </Field>
    <Field :data-invalid="errors.descricao ? true : undefined">
      <FieldLabel for="nova-descricao">Descrição</FieldLabel>
      <Input
        id="nova-descricao"
        v-model="descricao"
        maxlength="50"
        placeholder="TELECOMUNICACOES"
        :aria-invalid="errors.descricao ? true : undefined"
      />
      <FieldError :errors="[errors.descricao]" />
    </Field>
  </DialogoDeCadastro>
</template>
