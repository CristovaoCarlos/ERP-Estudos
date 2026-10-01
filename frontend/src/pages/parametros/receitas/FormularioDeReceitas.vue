<script setup lang="ts">
import { watch } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { CardContent, CardFooter } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { errosDosCampos } from '@/lib/empresas'
import { useFormulario } from '@/lib/formularios'
import {
  tributos,
  useSalvarParametroReceita,
  type ParametroReceita,
  type Receita,
} from '@/lib/parametros-receitas'

const props = defineProps<{ parametro: ParametroReceita; receitas: Receita[] }>()

/** O Select não aceita valor vazio: este representa "sem receita". */
const NENHUMA = 'nenhuma'

const esquema = z.object({ receitas: z.record(z.string(), z.string()) })

function paraCampos(parametro: ParametroReceita) {
  return {
    receitas: Object.fromEntries(
      tributos.map(({ chave }) => [chave, String(parametro.receitas[chave] ?? NENHUMA)]),
    ),
  }
}

function nomeDaReceita(receita: Receita): string {
  return receita.sigla ? `${receita.descricao} (${receita.sigla})` : receita.descricao
}

const salvar = useSalvarParametroReceita()
const { errors, handleSubmit, meta, resetForm, setFieldError, setFieldValue, values } =
  useFormulario(esquema, paraCampos(props.parametro))

// Depois de salvar, o que foi gravado vira o novo ponto de partida do "Descartar".
watch(
  () => props.parametro,
  (parametro) => resetForm({ values: paraCampos(parametro) }),
)

const enviar = handleSubmit(({ receitas: escolhidas }) =>
  salvar.mutate(
    {
      receitas: Object.fromEntries(
        tributos.map(({ chave }) => {
          const valor = escolhidas[chave]
          return [chave, valor && valor !== NENHUMA ? Number(valor) : null]
        }),
      ),
    },
    {
      onSuccess: () => toast.success('Parâmetros salvos.'),
      onError: (erro) => {
        const erros = errosDosCampos(erro)
        if (!erros) return toast.error('Não foi possível salvar os parâmetros.')
        for (const [campo, mensagem] of Object.entries(erros)) {
          setFieldError(campo as `receitas.${string}`, mensagem)
        }
      },
    },
  ),
)
</script>

<template>
  <form novalidate @submit="enviar">
    <CardContent class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Field
        v-for="tributo in tributos"
        :key="tributo.chave"
        :data-invalid="errors[`receitas.${tributo.chave}`] ? true : undefined"
      >
        <FieldLabel :for="`receita-${tributo.chave}`">{{ tributo.rotulo }}</FieldLabel>
        <Select
          :model-value="values.receitas[tributo.chave]"
          @update:model-value="(valor) => setFieldValue(`receitas.${tributo.chave}`, String(valor))"
        >
          <SelectTrigger
            :id="`receita-${tributo.chave}`"
            class="w-full"
            :aria-invalid="errors[`receitas.${tributo.chave}`] ? true : undefined"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem :value="NENHUMA">Sem receita</SelectItem>
            <SelectItem v-for="receita in receitas" :key="receita.id" :value="String(receita.id)">
              {{ nomeDaReceita(receita) }}
            </SelectItem>
          </SelectContent>
        </Select>
        <FieldError :errors="[errors[`receitas.${tributo.chave}`]]" />
      </Field>
    </CardContent>
    <CardFooter class="mt-6 justify-end gap-2 border-t">
      <Button
        type="button"
        variant="outline"
        :disabled="!meta.dirty || salvar.isPending.value"
        @click="resetForm()"
      >
        Descartar alterações
      </Button>
      <Button type="submit" :disabled="salvar.isPending.value">
        <Spinner v-if="salvar.isPending.value" data-icon="inline-start" />
        Salvar
      </Button>
    </CardFooter>
  </form>
</template>
