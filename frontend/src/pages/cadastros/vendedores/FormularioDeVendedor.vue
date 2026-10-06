<script setup lang="ts">
import { computed } from 'vue'
import { toast } from 'vue-sonner'

import ConteudoDoFormulario from '@/components/ConteudoDoFormulario.vue'
import Obrigatorio from '@/components/Obrigatorio.vue'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'
import { formatarTelefone } from '@/lib/cadastros-clientes'
import {
  useAlterarVendedor,
  useCadastrarVendedor,
  useRegioes,
  type Vendedor,
} from '@/lib/cadastros-vendedores'
import { formatarCpf } from '@/lib/cpf'
import { mostrarErrosDoServidor, useFormulario } from '@/lib/formularios'
import {
  CAMPOS,
  esquemaDoVendedor,
  paraApi,
  valoresIniciais,
} from '@/pages/cadastros/vendedores/esquema'

/** `vendedor` ausente: cadastro. Presente: alteração. */
const props = defineProps<{ vendedor?: Vendedor }>()
const emit = defineEmits<{ fechar: [] }>()

const regioes = useRegioes()
const cadastrar = useCadastrarVendedor()
const alterar = useAlterarVendedor(props.vendedor?.id ?? 0)
const salvando = computed(() => (props.vendedor ? alterar : cadastrar).isPending.value)

const { campo, errors, handleSubmit, setFieldError } = useFormulario(
  esquemaDoVendedor,
  valoresIniciais(props.vendedor),
)
const [nome] = campo('nome')
const [cpf] = campo('cpf')
const [admissao] = campo('data_admissao')
const [email] = campo('contato.email')
const [celular] = campo('contato.celular')
const [telefone] = campo('contato.telefone')
const [comissao] = campo('comercial.comissao')
const [meta] = campo('comercial.meta_mensal')
const [regiao] = campo('comercial.regiao')
const [observacoes] = campo('observacoes')
const [ativo] = campo('ativo')

const salvar = handleSubmit((dados) => {
  const corpo = paraApi(dados)
  const aoSalvar = {
    onSuccess: () => {
      toast.success(props.vendedor ? 'Vendedor alterado.' : 'Vendedor cadastrado.')
      emit('fechar')
    },
    onError: (erro: unknown) =>
      mostrarErrosDoServidor(
        erro,
        setFieldError,
        [...CAMPOS],
        'Não foi possível salvar o vendedor.',
      ),
  }
  if (props.vendedor) alterar.mutate(corpo, aoSalvar)
  else cadastrar.mutate(corpo, aoSalvar)
})

/** Atributos de um campo com erro. */
const invalido = (mensagem: string | undefined) => (mensagem ? true : undefined)
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <ConteudoDoFormulario chave="vendedor" largura="sm:w-2xl">
      <DialogHeader>
        <DialogTitle>{{ vendedor ? 'Alterar vendedor' : 'Novo vendedor' }}</DialogTitle>
        <DialogDescription>Dados de contato e condições comerciais do vendedor.</DialogDescription>
      </DialogHeader>
      <form id="form-vendedor" novalidate @submit="salvar">
        <FieldGroup class="gap-4">
          <Field :data-invalid="invalido(errors.nome)">
            <FieldLabel for="vendedor-nome">Nome <Obrigatorio /></FieldLabel>
            <Input
              id="vendedor-nome"
              v-model="nome"
              maxlength="150"
              :aria-invalid="invalido(errors.nome)"
            />
            <FieldError :errors="[errors.nome]" />
          </Field>
          <div class="grid gap-4 sm:grid-cols-2">
            <Field :data-invalid="invalido(errors.cpf)">
              <FieldLabel for="vendedor-cpf">CPF <Obrigatorio /></FieldLabel>
              <Input
                id="vendedor-cpf"
                :model-value="cpf"
                inputmode="numeric"
                placeholder="000.000.000-00"
                maxlength="14"
                autocomplete="off"
                class="font-mono"
                :aria-invalid="invalido(errors.cpf)"
                @update:model-value="(valor) => (cpf = formatarCpf(String(valor)))"
              />
              <FieldError :errors="[errors.cpf]" />
            </Field>
            <Field :data-invalid="invalido(errors.data_admissao)">
              <FieldLabel for="vendedor-admissao">Data de admissão</FieldLabel>
              <Input
                id="vendedor-admissao"
                v-model="admissao"
                type="date"
                :aria-invalid="invalido(errors.data_admissao)"
              />
              <FieldError :errors="[errors.data_admissao]" />
            </Field>
          </div>
          <Field :data-invalid="invalido(errors['contato.email'])">
            <FieldLabel for="vendedor-email">E-mail</FieldLabel>
            <Input
              id="vendedor-email"
              v-model="email"
              type="email"
              maxlength="150"
              autocomplete="off"
              :aria-invalid="invalido(errors['contato.email'])"
            />
            <FieldError :errors="[errors['contato.email']]" />
          </Field>
          <div class="grid gap-4 sm:grid-cols-2">
            <Field :data-invalid="invalido(errors['contato.celular'])">
              <FieldLabel for="vendedor-celular">Celular <Obrigatorio /></FieldLabel>
              <Input
                id="vendedor-celular"
                :model-value="celular"
                inputmode="tel"
                placeholder="(00) 00000-0000"
                maxlength="15"
                :aria-invalid="invalido(errors['contato.celular'])"
                @update:model-value="(valor) => (celular = formatarTelefone(String(valor)))"
              />
              <FieldError :errors="[errors['contato.celular']]" />
            </Field>
            <Field :data-invalid="invalido(errors['contato.telefone'])">
              <FieldLabel for="vendedor-telefone">Telefone</FieldLabel>
              <Input
                id="vendedor-telefone"
                :model-value="telefone"
                inputmode="tel"
                placeholder="(00) 0000-0000"
                maxlength="15"
                :aria-invalid="invalido(errors['contato.telefone'])"
                @update:model-value="(valor) => (telefone = formatarTelefone(String(valor)))"
              />
              <FieldError :errors="[errors['contato.telefone']]" />
            </Field>
          </div>
          <div class="grid gap-4 sm:grid-cols-3">
            <Field :data-invalid="invalido(errors['comercial.comissao'])">
              <FieldLabel for="vendedor-comissao">Comissão (%) <Obrigatorio /></FieldLabel>
              <Input
                id="vendedor-comissao"
                v-model="comissao"
                inputmode="decimal"
                placeholder="0,00"
                :aria-invalid="invalido(errors['comercial.comissao'])"
              />
              <FieldError
                v-if="errors['comercial.comissao']"
                :errors="[errors['comercial.comissao']]"
              />
              <FieldDescription v-else>Sobre o valor das vendas.</FieldDescription>
            </Field>
            <Field :data-invalid="invalido(errors['comercial.meta_mensal'])">
              <FieldLabel for="vendedor-meta">Meta mensal (R$)</FieldLabel>
              <Input
                id="vendedor-meta"
                v-model="meta"
                inputmode="decimal"
                placeholder="0,00"
                :aria-invalid="invalido(errors['comercial.meta_mensal'])"
              />
              <FieldError :errors="[errors['comercial.meta_mensal']]" />
            </Field>
            <Field :data-invalid="invalido(errors['comercial.regiao'])">
              <FieldLabel for="vendedor-regiao">Região</FieldLabel>
              <Input
                id="vendedor-regiao"
                v-model="regiao"
                maxlength="60"
                list="vendedor-regioes"
                autocomplete="off"
                :aria-invalid="invalido(errors['comercial.regiao'])"
              />
              <datalist id="vendedor-regioes">
                <option v-for="sugestao in regioes.data.value" :key="sugestao" :value="sugestao" />
              </datalist>
              <FieldError :errors="[errors['comercial.regiao']]" />
            </Field>
          </div>
          <Field :data-invalid="invalido(errors.observacoes)">
            <FieldLabel for="vendedor-observacoes">Observações</FieldLabel>
            <Textarea
              id="vendedor-observacoes"
              v-model="observacoes"
              rows="3"
              maxlength="5000"
              :aria-invalid="invalido(errors.observacoes)"
            />
            <FieldError :errors="[errors.observacoes]" />
          </Field>
          <label class="flex items-center gap-2 text-sm">
            <Checkbox
              :model-value="ativo"
              @update:model-value="(marcado) => (ativo = marcado === true)"
            />
            Vendedor ativo
            <span class="text-muted-foreground">(inativo não aparece nas vendas)</span>
          </label>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="form-vendedor" :disabled="salvando">
          <Spinner v-if="salvando" data-icon="inline-start" />
          {{ vendedor ? 'Salvar' : 'Cadastrar' }}
        </Button>
      </DialogFooter>
    </ConteudoDoFormulario>
  </Dialog>
</template>
