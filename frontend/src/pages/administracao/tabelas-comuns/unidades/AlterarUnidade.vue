<script setup lang="ts">
import { toast } from 'vue-sonner'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import Obrigatorio from '@/components/Obrigatorio.vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAlterarUnidade, type Unidade } from '@/lib/administracao-tabelas-comuns-unidades'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import { esquemaDaAlteracao } from '@/pages/administracao/tabelas-comuns/unidades/esquema'

/** Altera a descrição. A sigla aparece, mas não muda: é ela que os produtos guardam. */
const props = defineProps<{ unidade: Unidade }>()
const emit = defineEmits<{ fechar: [] }>()

const alterar = useAlterarUnidade(props.unidade.sigla)
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquemaDaAlteracao, {
  descricao: props.unidade.descricao,
})
const [descricao] = campo('descricao')

const salvar = handleSubmit((dados) =>
  alterar.mutate(dados, {
    onSuccess: () => {
      toast.success(`Unidade ${props.unidade.sigla} alterada.`)
      emit('fechar')
    },
    onError: (erro) =>
      mostrarErrosDoServidor(
        erro,
        setFieldError,
        ['descricao'],
        'Não foi possível alterar a unidade.',
      ),
  }),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-alterar-unidade"
    titulo="Alterar unidade"
    descricao="As unidades são as mesmas para todas as prefeituras: a alteração vale para todas."
    :salvando="alterar.isPending.value"
    rotulo-do-botao="Salvar"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field>
      <FieldLabel for="unidade-sigla">Sigla</FieldLabel>
      <Input id="unidade-sigla" :model-value="unidade.sigla" disabled class="w-28 font-mono" />
      <FieldDescription>Os produtos guardam a sigla: ela não muda.</FieldDescription>
    </Field>
    <Field :data-invalid="errors.descricao ? true : undefined">
      <FieldLabel for="unidade-descricao">Descrição <Obrigatorio /></FieldLabel>
      <Input
        id="unidade-descricao"
        v-model="descricao"
        maxlength="60"
        :aria-invalid="errors.descricao ? true : undefined"
      />
      <FieldError :errors="[errors.descricao]" />
    </Field>
  </DialogoDeCadastro>
</template>
