<script setup lang="ts">
import { computed } from 'vue'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUsuario } from '@/lib/auth'
import { menuPermitido } from '@/lib/navegacao'
import { nomeExibido, subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'

const usuario = useUsuario()
const prefeitura = usePrefeitura(subdominioDaPrefeitura())
const modulos = computed(() =>
  menuPermitido(usuario.data.value?.permissoes ?? []).filter((modulo) => modulo.url !== '/'),
)
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">
        Olá, {{ usuario.data.value?.name.split(' ')[0] }}
      </h1>
      <p class="text-muted-foreground">
        <template v-if="prefeitura.data.value">{{ nomeExibido(prefeitura.data.value) }}</template>
        · ERP para Estudos
      </p>
    </div>
    <div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      <RouterLink
        v-for="modulo in modulos"
        :key="modulo.url"
        :to="modulo.paginas?.[0]?.url ?? modulo.url"
        class="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
      >
        <Card class="h-full transition-colors hover:bg-accent">
          <CardHeader>
            <component :is="modulo.icone" class="text-muted-foreground" />
            <CardTitle>{{ modulo.titulo }}</CardTitle>
            <CardDescription>
              {{
                modulo.paginas
                  ? modulo.paginas.map((pagina) => pagina.titulo).join(' · ')
                  : 'Abrir módulo'
              }}
            </CardDescription>
          </CardHeader>
        </Card>
      </RouterLink>
    </div>
  </div>
</template>
