<script setup lang="ts">
import { CircleAlert } from '@lucide/vue'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Toaster } from '@/components/ui/sonner'
import { Spinner } from '@/components/ui/spinner'
import { prefeituraNaoEncontrada, subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'
import Landing from '@/pages/Landing.vue'
import 'vue-sonner/style.css'

const subdominio = subdominioDaPrefeitura()
const prefeitura = usePrefeitura(subdominio)
</script>

<template>
  <Landing v-if="subdominio === null" />

  <div v-else-if="prefeitura.isPending.value" class="flex min-h-svh items-center justify-center">
    <Spinner />
  </div>

  <template v-else-if="prefeitura.isError.value">
    <Landing v-if="prefeituraNaoEncontrada(prefeitura.error.value)" :nao-encontrada="subdominio" />
    <div v-else class="flex min-h-svh items-center justify-center p-6">
      <Alert variant="destructive" class="max-w-md">
        <CircleAlert />
        <AlertTitle>Não foi possível conectar ao servidor</AlertTitle>
        <AlertDescription>Tente novamente em alguns instantes.</AlertDescription>
      </Alert>
    </div>
  </template>

  <RouterView v-else />

  <Toaster rich-colors />
</template>
