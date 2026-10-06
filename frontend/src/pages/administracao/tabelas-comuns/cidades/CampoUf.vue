<script setup lang="ts">
import Obrigatorio from '@/components/Obrigatorio.vue'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

/** UF numa lista de seleção, usada na inclusão e na alteração. */
defineProps<{ id: string; erro?: string; obrigatorio?: boolean }>()
const uf = defineModel<string>({ required: true })

const UFS = [
  'AC',
  'AL',
  'AM',
  'AP',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MG',
  'MS',
  'MT',
  'PA',
  'PB',
  'PE',
  'PI',
  'PR',
  'RJ',
  'RN',
  'RO',
  'RR',
  'RS',
  'SC',
  'SE',
  'SP',
  'TO',
]
</script>

<template>
  <Field :data-invalid="erro ? true : undefined">
    <FieldLabel :for="id">UF <Obrigatorio v-if="obrigatorio" /></FieldLabel>
    <Select v-model="uf">
      <SelectTrigger :id="id" class="w-28" :aria-invalid="erro ? true : undefined">
        <SelectValue placeholder="UF" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem v-for="sigla in UFS" :key="sigla" :value="sigla">{{ sigla }}</SelectItem>
      </SelectContent>
    </Select>
    <FieldError :errors="[erro]" />
  </Field>
</template>
