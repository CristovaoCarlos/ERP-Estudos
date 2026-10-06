<script setup lang="ts">
import { toast } from 'vue-sonner'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import Obrigatorio from '@/components/Obrigatorio.vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCadastrarUnidade } from '@/lib/administracao-tabelas-comuns-unidades'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import { esquemaDaUnidade } from '@/pages/administracao/tabelas-comuns/unidades/esquema'

const emit = defineEmits<{ fechar: [] }>()

const cadastrar = useCadastrarUnidade()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquemaDaUnidade, {
  sigla: '',
  descricao: '',
})
const [sigla] = campo('sigla')
const [descricao] = campo('descricao')

const salvar = handleSubmit((dados) =>
  cadastrar.mutate(dados, {
    onSuccess: () => {
      toast.success(`Unidade ${dados.sigla} cadastrada.`)
      emit('fechar')
    },
    onError: (erro) =>
      mostrarErrosDoServidor(
        erro,
        setFieldError,
        ['sigla', 'descricao'],
        'Não foi possível cadastrar a unidade.',
      ),
  }),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-unidade"
    titulo="Nova unidade"
    descricao="As unidades são as mesmas para todas as prefeituras: a unidade cadastrada vale para todas."
    :salvando="cadastrar.isPending.value"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field :data-invalid="errors.sigla ? true : undefined">
      <FieldLabel for="unidade-sigla">Sigla <Obrigatorio /></FieldLabel>
      <Input
        id="unidade-sigla"
        :model-value="sigla"
        maxlength="6"
        placeholder="UN"
        class="w-28 font-mono uppercase"
        :aria-invalid="errors.sigla ? true : undefined"
        @update:model-value="(valor) => (sigla = String(valor).toUpperCase())"
      />
      <FieldError v-if="errors.sigla" :errors="[errors.sigla]" />
      <FieldDescription v-else
        >Vai no produto e na NF-e. Não pode ser alterada depois.</FieldDescription
      >
    </Field>
    <Field :data-invalid="errors.descricao ? true : undefined">
      <FieldLabel for="unidade-descricao">Descrição <Obrigatorio /></FieldLabel>
      <Input
        id="unidade-descricao"
        v-model="descricao"
        maxlength="60"
        placeholder="Unidade"
        :aria-invalid="errors.descricao ? true : undefined"
      />
      <FieldError :errors="[errors.descricao]" />
    </Field>
  </DialogoDeCadastro>
</template>
