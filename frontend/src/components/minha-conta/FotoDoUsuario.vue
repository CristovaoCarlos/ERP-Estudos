<script setup lang="ts">
import { ImageUp } from '@lucide/vue'
import { useMutation, useQueryClient } from '@tanstack/vue-query'
import { ref } from 'vue'
import { toast } from 'vue-sonner'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { api } from '@/lib/api'
import { iniciais, type Usuario } from '@/lib/auth'
import { errosDosCampos } from '@/lib/empresas'

/** Envio e remoção da foto. Vale em todas as prefeituras, como o nome e o e-mail. */
defineProps<{ usuario: Usuario }>()

const queryClient = useQueryClient()
const arquivo = ref<HTMLInputElement>()

function atualizar(foto: string | null) {
  queryClient.setQueryData(['me'], (atual?: Usuario) => (atual ? { ...atual, foto } : atual))
  queryClient.invalidateQueries({ queryKey: ['usuarios'] })
}

const enviar = useMutation({
  mutationFn: async (imagem: File) => {
    const dados = new FormData()
    dados.append('foto', imagem)
    return (await api.post<{ foto: string }>('/me/foto', dados)).data
  },
  onSuccess: ({ foto }) => {
    atualizar(foto)
    toast.success('Foto atualizada.')
  },
  onError: (erro) => toast.error(errosDosCampos(erro)?.foto ?? 'Não foi possível enviar a foto.'),
})

const remover = useMutation({
  mutationFn: () => api.delete('/me/foto'),
  onSuccess: () => {
    atualizar(null)
    toast.success('Foto removida.')
  },
  onError: () => toast.error('Não foi possível remover a foto.'),
})

function escolher(evento: Event) {
  const campo = evento.target as HTMLInputElement
  const imagem = campo.files?.[0]
  campo.value = ''
  if (imagem) enviar.mutate(imagem)
}
</script>

<template>
  <div class="flex items-center gap-4">
    <Avatar class="size-14 rounded-lg">
      <AvatarImage v-if="usuario.foto" :src="usuario.foto" alt="" class="rounded-lg" />
      <AvatarFallback class="rounded-lg bg-marca text-lg text-marca-foreground">
        {{ iniciais(usuario.name) }}
      </AvatarFallback>
    </Avatar>
    <div class="flex flex-col items-start gap-1">
      <div class="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          :disabled="enviar.isPending.value"
          @click="arquivo?.click()"
        >
          <Spinner v-if="enviar.isPending.value" data-icon="inline-start" />
          <ImageUp v-else />
          Enviar foto
        </Button>
        <Button
          v-if="usuario.foto"
          type="button"
          variant="ghost"
          size="sm"
          :disabled="remover.isPending.value"
          @click="remover.mutate()"
        >
          Remover
        </Button>
      </div>
      <span class="text-xs text-muted-foreground">JPEG, PNG ou WebP, até 2 MB.</span>
    </div>
    <input
      ref="arquivo"
      type="file"
      accept="image/jpeg,image/png,image/webp"
      aria-label="Foto"
      class="sr-only"
      @change="escolher"
    />
  </div>
</template>
