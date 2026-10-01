<script setup lang="ts">
import { ref } from 'vue'
import { toast } from 'vue-sonner'

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
import { Spinner } from '@/components/ui/spinner'
import { useGrupos } from '@/lib/grupos'
import { useAlterarVinculos, type UsuarioDaPrefeitura } from '@/lib/usuarios'

/** Grupos do usuário nesta prefeitura. */
const props = defineProps<{ usuario: UsuarioDaPrefeitura }>()
const emit = defineEmits<{ fechar: [] }>()

const grupos = useGrupos()
const salvar = useAlterarVinculos(props.usuario.id)
const selecionados = ref<string[]>(props.usuario.grupos)

function alternar(nome: string, marcado: boolean) {
  selecionados.value = marcado
    ? [...selecionados.value, nome]
    : selecionados.value.filter((atual) => atual !== nome)
}

function confirmar() {
  salvar.mutate(selecionados.value, {
    onSuccess: () => {
      toast.success(`Vínculos de ${props.usuario.name} atualizados.`)
      emit('fechar')
    },
    onError: () => toast.error('Não foi possível salvar os vínculos.'),
  })
}
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Editar vínculos</DialogTitle>
        <DialogDescription>
          Grupos de {{ usuario.name }} nesta prefeitura. Eles definem as telas que ele enxerga.
        </DialogDescription>
      </DialogHeader>
      <div class="flex flex-col gap-3">
        <p v-if="grupos.data.value?.length === 0" class="text-sm text-muted-foreground">
          Esta prefeitura ainda não tem grupos. Cadastre em Administração › Grupos de acesso.
        </p>
        <label
          v-for="grupo in grupos.data.value"
          :key="grupo.id"
          class="flex items-start gap-2 text-sm"
        >
          <Checkbox
            class="mt-0.5"
            :model-value="selecionados.includes(grupo.nome)"
            @update:model-value="(marcado) => alternar(grupo.nome, marcado === true)"
          />
          <span class="flex flex-col">
            {{ grupo.nome }}
            <span class="text-xs text-muted-foreground">{{ grupo.telas.length }} tela(s)</span>
          </span>
        </label>
        <p class="text-sm text-muted-foreground">
          Sem grupo, o usuário entra na prefeitura mas vê apenas o Início.
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" @click="emit('fechar')">Cancelar</Button>
        <Button :disabled="salvar.isPending.value" @click="confirmar">
          <Spinner v-if="salvar.isPending.value" data-icon="inline-start" />
          Salvar
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
