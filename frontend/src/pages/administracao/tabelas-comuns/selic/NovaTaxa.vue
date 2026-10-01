<script setup lang="ts">
import { toast } from 'vue-sonner'
import { z } from 'zod'

import DialogoDeCadastro from '@/components/DialogoDeCadastro.vue'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCadastrarSelic } from '@/lib/administracao-tabelas-comuns-selic'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import { mesPorExtenso } from '@/pages/administracao/tabelas-comuns/selic/formato'

const emit = defineEmits<{ fechar: [] }>()

const esquema = z.object({
  ano: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'Informe o ano com 4 dígitos.'),
  mes: z.string().min(1, 'Escolha o mês.'),
  valor: z
    .string()
    .trim()
    .regex(/^(\d{1,3}([.,]\d{1,2})?)?$/, 'Informe a taxa com até 2 casas (ex.: 0,87).'),
})

const meses = Array.from({ length: 12 }, (_, i) => i + 1)

const cadastrar = useCadastrarSelic()
const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  ano: String(new Date().getFullYear()),
  mes: '',
  valor: '',
})
const [ano] = campo('ano')
const [mes] = campo('mes')
const [valor] = campo('valor')

const salvar = handleSubmit(({ ano, mes, valor }) =>
  cadastrar.mutate(
    { ano: Number(ano), mes: Number(mes), valor: valor ? valor.replace(',', '.') : null },
    {
      onSuccess: () => {
        toast.success(`Taxa de ${mes.padStart(2, '0')}/${ano} cadastrada.`)
        emit('fechar')
      },
      onError: (erro) =>
        mostrarErrosDoServidor(
          erro,
          setFieldError,
          ['ano', 'mes', 'valor'],
          'Não foi possível cadastrar a taxa.',
        ),
    },
  ),
)
</script>

<template>
  <DialogoDeCadastro
    id="form-selic"
    titulo="Nova taxa"
    descricao="A SELIC é a mesma para todas as prefeituras: a taxa cadastrada vale para todas."
    :salvando="cadastrar.isPending.value"
    @enviar="salvar"
    @fechar="emit('fechar')"
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <Field :data-invalid="errors.ano ? true : undefined">
        <FieldLabel for="ano">Ano</FieldLabel>
        <Input
          id="ano"
          v-model="ano"
          inputmode="numeric"
          maxlength="4"
          class="font-mono"
          :aria-invalid="errors.ano ? true : undefined"
        />
        <FieldError :errors="[errors.ano]" />
      </Field>
      <Field :data-invalid="errors.mes ? true : undefined">
        <FieldLabel for="mes">Mês</FieldLabel>
        <Select v-model="mes">
          <SelectTrigger id="mes" class="w-full" :aria-invalid="errors.mes ? true : undefined">
            <SelectValue placeholder="Escolha o mês" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem v-for="numero in meses" :key="numero" :value="String(numero)">
              {{ mesPorExtenso(numero) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <FieldError :errors="[errors.mes]" />
      </Field>
    </div>
    <Field :data-invalid="errors.valor ? true : undefined">
      <FieldLabel for="valor">Taxa (%)</FieldLabel>
      <Input
        id="valor"
        v-model="valor"
        inputmode="decimal"
        placeholder="0,87"
        class="w-32 text-right tabular-nums"
        :aria-invalid="errors.valor ? true : undefined"
      />
      <FieldDescription>Deixe em branco se a taxa do mês ainda não saiu.</FieldDescription>
      <FieldError :errors="[errors.valor]" />
    </Field>
  </DialogoDeCadastro>
</template>
