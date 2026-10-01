<script setup lang="ts">
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { iniciais, type Usuario } from '@/lib/auth'

defineProps<{ usuario: Usuario }>()
</script>

<template>
  <Avatar class="size-8 rounded-lg">
    <AvatarImage v-if="usuario.foto" :src="usuario.foto" alt="" class="rounded-lg" />
    <AvatarFallback class="rounded-lg">{{ iniciais(usuario.name) }}</AvatarFallback>
  </Avatar>
  <div class="grid flex-1 text-left text-sm leading-tight">
    <span class="truncate font-medium">{{ usuario.name }}</span>
    <span class="truncate text-xs">{{ usuario.email }}</span>
  </div>
</template>
