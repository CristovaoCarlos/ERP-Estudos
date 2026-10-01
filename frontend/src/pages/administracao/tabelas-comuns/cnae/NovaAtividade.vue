<script setup lang="ts">
import { reactive } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useCadastrarCnae } from '@/lib/administracao-tabelas-comuns-cnae'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'

const props = defineProps<{ versaoPadrao: string }>()
const emit = defineEmits<{ fechar: [] }>()

const opcional = (formato: RegExp, mensagem: string) =>
  z.string().trim().regex(formato, mensagem).or(z.literal(''))

const esquema = z.object({
  secao: z
    .string()
    .trim()
    .regex(/^[A-Ua-u]$/, 'A seção é uma letra de A a U.'),
  divisao: opcional(/^\d{2}$/, 'A divisão tem 2 dígitos (ex.: 85).'),
  grupo: opcional(/^\d{2}\.\d$/, 'O grupo segue o formato 85.9.'),
  classe: opcional(/^\d{2}\.\d{2}-\d$/, 'A classe segue o formato 85.93-7.'),
  subclasse: opcional(/^\d{4}-\d\/\d{2}$/, 'A subclasse segue o formato 8593-7/00.'),
  denominacao: z
    .string()
    .trim()
    .min(1, 'Informe a denominação.')
    .max(200, 'Use no máximo 200 caracteres.'),
  versao: z.string().trim().max(4, 'Use no máximo 4 caracteres.'),
  ativo: z.boolean(),
})

/** Níveis abaixo da seção, na ordem da hierarquia, com um exemplo de código. */
const niveisDoFormulario = [
  { campo: 'divisao', rotulo: 'Divisão', exemplo: '85' },
  { campo: 'grupo', rotulo: 'Grupo', exemplo: '85.9' },
  { campo: 'classe', rotulo: 'Classe', exemplo: '85.93-7' },
  { campo: 'subclasse', rotulo: 'Subclasse', exemplo: '8593-7/00' },
] as const

const cadastrar = useCadastrarCnae()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  secao: '',
  divisao: '',
  grupo: '',
  classe: '',
  subclasse: '',
  denominacao: '',
  versao: props.versaoPadrao,
  ativo: true,
})
const [secao] = campo('secao')
const [denominacao] = campo('denominacao')
const [versao] = campo('versao')
const [ativo] = campo('ativo')
/** Divisão, grupo, classe e subclasse, pelo nome do campo. */
const niveis = reactive({
  divisao: campo('divisao')[0],
  grupo: campo('grupo')[0],
  classe: campo('classe')[0],
  subclasse: campo('subclasse')[0],
})

const salvar = handleSubmit((dados) =>
  cadastrar.mutate(
    {
      ...dados,
      secao: dados.secao.toUpperCase(),
      divisao: dados.divisao || null,
      grupo: dados.grupo || null,
      classe: dados.classe || null,
      subclasse: dados.subclasse || null,
      versao: dados.versao || null,
    },
    {
      onSuccess: () => {
        toast.success('Atividade cadastrada.')
        emit('fechar')
      },
      onError: (erro) =>
        mostrarErrosDoServidor(
          erro,
          setFieldError,
          ['secao', 'divisao', 'grupo', 'classe', 'subclasse', 'denominacao', 'versao'],
          'Não foi possível cadastrar a atividade.',
        ),
    },
  ),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-cnae"
    titulo="Nova atividade"
    descricao="A CNAE é a mesma para todas as prefeituras: a atividade cadastrada vale para todas. Preencha até o nível da atividade; cada nível começa pelo código do nível de cima."
    :salvando="cadastrar.isPending.value"
    largo
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <div class="grid gap-4 sm:grid-cols-5">
      <Field :data-invalid="errors.secao ? true : undefined">
        <FieldLabel for="secao">Seção</FieldLabel>
        <Input
          id="secao"
          v-model="secao"
          maxlength="1"
          placeholder="P"
          class="font-mono uppercase"
          :aria-invalid="errors.secao ? true : undefined"
        />
        <FieldError :errors="[errors.secao]" />
      </Field>
      <Field
        v-for="nivel in niveisDoFormulario"
        :key="nivel.campo"
        :data-invalid="errors[nivel.campo] ? true : undefined"
      >
        <FieldLabel :for="nivel.campo">{{ nivel.rotulo }}</FieldLabel>
        <Input
          :id="nivel.campo"
          v-model="niveis[nivel.campo]"
          :placeholder="nivel.exemplo"
          class="font-mono"
          :aria-invalid="errors[nivel.campo] ? true : undefined"
        />
        <FieldError :errors="[errors[nivel.campo]]" />
      </Field>
    </div>
    <Field :data-invalid="errors.denominacao ? true : undefined">
      <FieldLabel for="denominacao">Denominação</FieldLabel>
      <Input
        id="denominacao"
        v-model="denominacao"
        maxlength="200"
        placeholder="Ensino de idiomas"
        :aria-invalid="errors.denominacao ? true : undefined"
      />
      <FieldError :errors="[errors.denominacao]" />
    </Field>
    <div class="flex flex-wrap items-end gap-6">
      <Field :data-invalid="errors.versao ? true : undefined" class="w-28">
        <FieldLabel for="versao">Versão</FieldLabel>
        <Input
          id="versao"
          v-model="versao"
          maxlength="4"
          class="font-mono"
          :aria-invalid="errors.versao ? true : undefined"
        />
        <FieldError :errors="[errors.versao]" />
      </Field>
      <label class="flex items-center gap-2 pb-2 text-sm">
        <Checkbox
          :model-value="ativo"
          @update:model-value="(marcado) => (ativo = marcado === true)"
        />
        Ativa
      </label>
    </div>
  </DialogoDeCadastro>
</template>
