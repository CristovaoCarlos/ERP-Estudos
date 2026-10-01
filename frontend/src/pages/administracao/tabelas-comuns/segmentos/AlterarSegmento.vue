<script setup lang="ts">
import { toast } from 'vue-sonner'
import { z } from 'zod'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAlterarSegmento, type Segmento } from '@/lib/administracao-tabelas-comuns-segmentos'
import { errosDosCampos } from '@/lib/empresas'
import { useFormulario } from '@/lib/formularios'
import { descricao as esquemaDaDescricao } from '@/pages/administracao/tabelas-comuns/segmentos/esquema'

const props = defineProps<{ segmento: Segmento }>()
const emit = defineEmits<{ fechar: [] }>()

const alterar = useAlterarSegmento(props.segmento.codigo)
const { campo, errors, handleSubmit, setFieldError } = useFormulario(
  z.object({ descricao: esquemaDaDescricao }),
  { descricao: props.segmento.descricao },
)
const [descricao] = campo('descricao')

const salvar = handleSubmit((dados) =>
  alterar.mutate(dados, {
    onSuccess: () => {
      toast.success(`Segmento ${props.segmento.codigo} alterado.`)
      emit('fechar')
    },
    onError: (erro) => {
      const erros = errosDosCampos(erro)
      if (erros?.descricao) setFieldError('descricao', erros.descricao)
      else toast.error('Não foi possível alterar o segmento.')
    },
  }),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-segmento"
    titulo="Alterar segmento"
    descricao="Os segmentos são os mesmos para todas as prefeituras: a alteração vale para todas."
    :salvando="alterar.isPending.value"
    rotulo-do-botao="Salvar"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field>
      <FieldLabel for="codigo">Código</FieldLabel>
      <Input id="codigo" :model-value="segmento.codigo" readonly disabled class="w-20 font-mono" />
      <FieldDescription>
        O código não muda: ele vai no código de barras e nos convênios das prefeituras.
      </FieldDescription>
    </Field>
    <Field :data-invalid="errors.descricao ? true : undefined">
      <FieldLabel for="descricao">Descrição</FieldLabel>
      <Input
        id="descricao"
        v-model="descricao"
        maxlength="50"
        :aria-invalid="errors.descricao ? true : undefined"
      />
      <FieldError :errors="[errors.descricao]" />
    </Field>
  </DialogoDeCadastro>
</template>
