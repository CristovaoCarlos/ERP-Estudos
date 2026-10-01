<script setup lang="ts">
import { toast } from 'vue-sonner'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useAlterarCidade, type Cidade } from '@/lib/administracao-tabelas-comuns-cidades'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import CampoUf from '@/pages/administracao/tabelas-comuns/cidades/CampoUf.vue'
import { esquemaDaAlteracao } from '@/pages/administracao/tabelas-comuns/cidades/esquema'

/** Altera nome e UF. O código do IBGE aparece, mas não muda: é ele que identifica o município. */
const props = defineProps<{ cidade: Cidade }>()
const emit = defineEmits<{ fechar: [] }>()

const alterar = useAlterarCidade(props.cidade.id)
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquemaDaAlteracao, {
  nome: props.cidade.nome,
  uf: props.cidade.uf,
})
const [nome] = campo('nome')
const [uf] = campo('uf')

const salvar = handleSubmit((dados) =>
  alterar.mutate(dados, {
    onSuccess: () => {
      toast.success(`Cidade ${dados.nome} alterada.`)
      emit('fechar')
    },
    onError: (erro) =>
      mostrarErrosDoServidor(
        erro,
        setFieldError,
        ['nome', 'uf'],
        'Não foi possível alterar a cidade.',
      ),
  }),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-alterar-cidade"
    titulo="Alterar cidade"
    descricao="As cidades são as mesmas para todas as prefeituras: a alteração vale para todas."
    :salvando="alterar.isPending.value"
    rotulo-do-botao="Salvar"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field>
      <FieldLabel for="alterar-codigo">Código IBGE</FieldLabel>
      <Input
        id="alterar-codigo"
        :model-value="cidade.codigo_ibge"
        readonly
        disabled
        class="w-32 font-mono"
      />
      <FieldDescription>O código do IBGE identifica o município e não muda.</FieldDescription>
    </Field>
    <Field :data-invalid="errors.nome ? true : undefined">
      <FieldLabel for="alterar-nome">Nome</FieldLabel>
      <Input
        id="alterar-nome"
        v-model="nome"
        maxlength="100"
        :aria-invalid="errors.nome ? true : undefined"
      />
      <FieldError :errors="[errors.nome]" />
    </Field>
    <CampoUf id="alterar-uf" v-model="uf" :erro="errors.uf" />
  </DialogoDeCadastro>
</template>
