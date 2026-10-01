<script setup lang="ts">
import { toast } from 'vue-sonner'
import { z } from 'zod'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  useAlterarItemLcp116,
  type ItemLcp116,
} from '@/lib/administracao-tabelas-comuns-lista-de-servicos'
import { errosDosCampos } from '@/lib/empresas'
import { useFormulario } from '@/lib/formularios'
import { descricao as esquemaDaDescricao } from '@/pages/administracao/tabelas-comuns/lista-de-servicos/esquema'

const props = defineProps<{ item: ItemLcp116 }>()
const emit = defineEmits<{ fechar: [] }>()

const alterar = useAlterarItemLcp116(props.item.codigo)
const { campo, errors, handleSubmit, setFieldError } = useFormulario(
  z.object({ descricao: esquemaDaDescricao }),
  { descricao: props.item.descricao },
)
const [descricao] = campo('descricao')

const salvar = handleSubmit((dados) =>
  alterar.mutate(dados, {
    onSuccess: () => {
      toast.success(`Item ${props.item.codigo} alterado.`)
      emit('fechar')
    },
    onError: (erro) => {
      const erros = errosDosCampos(erro)
      if (erros?.descricao) setFieldError('descricao', erros.descricao)
      else toast.error('Não foi possível alterar o item.')
    },
  }),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-lcp116"
    :titulo="`Alterar ${item.tipo === 'item' ? 'item' : 'subitem'}`"
    descricao="A lista de serviços é a mesma para todas as prefeituras: a alteração vale para todas."
    :salvando="alterar.isPending.value"
    rotulo-do-botao="Salvar"
    largo
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field>
      <FieldLabel for="codigo">Código</FieldLabel>
      <Input id="codigo" :model-value="item.codigo" readonly disabled class="w-32 font-mono" />
      <FieldDescription>
        O código não muda: é por ele que os serviços das prefeituras apontam para o item.
      </FieldDescription>
    </Field>
    <Field :data-invalid="errors.descricao ? true : undefined">
      <FieldLabel for="descricao">Descrição</FieldLabel>
      <Textarea
        id="descricao"
        v-model="descricao"
        rows="6"
        :aria-invalid="errors.descricao ? true : undefined"
      />
      <FieldError :errors="[errors.descricao]" />
    </Field>
  </DialogoDeCadastro>
</template>
