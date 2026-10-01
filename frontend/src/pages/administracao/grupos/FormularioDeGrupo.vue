<script setup lang="ts">
import { computed, ref } from 'vue'
import { toast } from 'vue-sonner'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { errosDosCampos } from '@/lib/empresas'
import { useFormulario } from '@/lib/formularios'
import { useAlterarGrupo, useCadastrarGrupo, type Grupo } from '@/lib/grupos'
import { permissaoDaTela, telasPorModulo } from '@/lib/navegacao'

/** `grupo` ausente: cadastro. Presente: alteração. */
const props = defineProps<{ grupo?: Grupo }>()
const emit = defineEmits<{ fechar: [] }>()

const esquema = z.object({
  nome: z.string().trim().min(1, 'Informe o nome.').max(60, 'Use no máximo 60 caracteres.'),
})

const modulos = telasPorModulo().map(({ modulo, telas }) => ({
  modulo,
  telas,
  permissoes: telas.map((tela) => permissaoDaTela(tela.url)),
}))

const cadastrar = useCadastrarGrupo()
const alterar = useAlterarGrupo(props.grupo?.id ?? 0)
const salvando = computed(() => (props.grupo ? alterar : cadastrar).isPending.value)
const telas = ref<string[]>(props.grupo?.telas ?? [])

const { campo, errors, handleSubmit, setFieldError } = useFormulario(esquema, {
  nome: props.grupo?.nome ?? '',
})
const [nome] = campo('nome')

function alternar(permissao: string, marcado: boolean) {
  telas.value = marcado
    ? [...telas.value, permissao]
    : telas.value.filter((atual) => atual !== permissao)
}

function marcarModulo(permissoes: string[], marcar: boolean) {
  telas.value = marcar
    ? [...new Set([...telas.value, ...permissoes])]
    : telas.value.filter((atual) => !permissoes.includes(atual))
}

const marcadas = (permissoes: string[]) =>
  permissoes.filter((permissao) => telas.value.includes(permissao)).length

const salvar = handleSubmit(({ nome }) =>
  (props.grupo ? alterar : cadastrar).mutate(
    { nome, telas: telas.value },
    {
      onSuccess: () => {
        toast.success(props.grupo ? 'Grupo alterado.' : 'Grupo cadastrado.')
        emit('fechar')
      },
      onError: (erro) => {
        const erros = errosDosCampos(erro)
        if (erros?.nome) setFieldError('nome', erros.nome)
        else toast.error(Object.values(erros ?? {})[0] ?? 'Não foi possível salvar o grupo.')
      },
    },
  ),
)
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <DialogContent class="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>{{ grupo ? 'Alterar grupo' : 'Novo grupo' }}</DialogTitle>
        <DialogDescription>
          Escolha as telas do grupo. Quem estiver nele enxerga no menu apenas essas telas, além do
          Início.
        </DialogDescription>
      </DialogHeader>
      <form id="form-grupo" novalidate @submit="salvar">
        <FieldGroup>
          <Field :data-invalid="errors.nome ? true : undefined">
            <FieldLabel for="nome">Nome</FieldLabel>
            <Input
              id="nome"
              v-model="nome"
              placeholder="Fiscalização de obras"
              :aria-invalid="errors.nome ? true : undefined"
            />
            <FieldError :errors="[errors.nome]" />
          </Field>
          <Field>
            <FieldLabel for="telas">Telas</FieldLabel>
            <div id="telas" class="flex flex-col gap-5">
              <fieldset v-for="item in modulos" :key="item.modulo.url" class="flex flex-col gap-2">
                <legend class="sr-only">{{ item.modulo.titulo }}</legend>
                <div class="flex items-center justify-between gap-4 border-b pb-1">
                  <span class="flex items-center gap-2 text-sm font-medium">
                    <component :is="item.modulo.icone" class="size-4 text-muted-foreground" />
                    {{ item.modulo.titulo }}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    @click="
                      marcarModulo(
                        item.permissoes,
                        marcadas(item.permissoes) < item.permissoes.length,
                      )
                    "
                  >
                    {{
                      marcadas(item.permissoes) < item.permissoes.length
                        ? 'Marcar todas'
                        : 'Desmarcar todas'
                    }}
                  </Button>
                </div>
                <div class="grid gap-2 sm:grid-cols-2">
                  <label
                    v-for="(tela, indice) in item.telas"
                    :key="tela.url"
                    class="flex items-center gap-2 text-sm text-muted-foreground"
                  >
                    <Checkbox
                      :model-value="telas.includes(item.permissoes[indice])"
                      @update:model-value="
                        (marcado) => alternar(item.permissoes[indice], marcado === true)
                      "
                    />
                    {{ tela.titulo }}
                  </label>
                </div>
              </fieldset>
            </div>
            <FieldDescription>
              {{ telas.length }} tela(s) selecionada(s). Sem nenhuma, o grupo não libera nada.
            </FieldDescription>
          </Field>
        </FieldGroup>
      </form>
      <DialogFooter>
        <Button type="submit" form="form-grupo" :disabled="salvando">
          <Spinner v-if="salvando" data-icon="inline-start" />
          {{ grupo ? 'Salvar' : 'Cadastrar' }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
