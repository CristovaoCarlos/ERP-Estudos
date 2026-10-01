<script setup lang="ts">
import { toast } from 'vue-sonner'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCadastrarCidade } from '@/lib/administracao-tabelas-comuns-cidades'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import CampoUf from '@/pages/administracao/tabelas-comuns/cidades/CampoUf.vue'
import { esquemaDaCidade } from '@/pages/administracao/tabelas-comuns/cidades/esquema'

const emit = defineEmits<{ fechar: [] }>()

const cadastrar = useCadastrarCidade()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquemaDaCidade, {
  codigo_ibge: '',
  nome: '',
  uf: '',
})
const [codigo] = campo('codigo_ibge')
const [nome] = campo('nome')
const [uf] = campo('uf')

const salvar = handleSubmit((dados) =>
  cadastrar.mutate(dados, {
    onSuccess: () => {
      toast.success('Cidade cadastrada.')
      emit('fechar')
    },
    onError: (erro) =>
      mostrarErrosDoServidor(
        erro,
        setFieldError,
        ['codigo_ibge', 'nome', 'uf'],
        'Não foi possível cadastrar a cidade.',
      ),
  }),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-cidade"
    titulo="Nova cidade"
    descricao="As cidades são as mesmas para todas as prefeituras: a cidade cadastrada vale para todas."
    :salvando="cadastrar.isPending.value"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <Field :data-invalid="errors.codigo_ibge ? true : undefined">
      <FieldLabel for="codigo_ibge">Código IBGE</FieldLabel>
      <Input
        id="codigo_ibge"
        v-model="codigo"
        inputmode="numeric"
        maxlength="7"
        placeholder="3550308"
        class="w-32 font-mono"
        :aria-invalid="errors.codigo_ibge ? true : undefined"
      />
      <FieldError :errors="[errors.codigo_ibge]" />
    </Field>
    <Field :data-invalid="errors.nome ? true : undefined">
      <FieldLabel for="nome">Nome</FieldLabel>
      <Input
        id="nome"
        v-model="nome"
        maxlength="100"
        placeholder="São Paulo"
        :aria-invalid="errors.nome ? true : undefined"
      />
      <FieldError :errors="[errors.nome]" />
    </Field>
    <CampoUf id="uf" v-model="uf" :erro="errors.uf" />
  </DialogoDeCadastro>
</template>
