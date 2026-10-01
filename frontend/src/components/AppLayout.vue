<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'

import AppSidebar from '@/components/AppSidebar.vue'
import SeletorDeTema from '@/components/SeletorDeTema.vue'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useLarguraDoMenu } from '@/composables/use-largura-do-menu'
import { useUsuario } from '@/lib/auth'
import { localizar, primeiraTela } from '@/lib/navegacao'
import { subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'

const route = useRoute()
const usuario = useUsuario()
const prefeitura = usePrefeitura(subdominioDaPrefeitura())
const trilha = computed(() => localizar(route.path))
const { largura, alterar } = useLarguraDoMenu()
const arrastando = ref(false)
</script>

<template>
  <SidebarProvider
    v-if="usuario.data.value && prefeitura.data.value"
    :style="{ '--sidebar-width': `${largura}px` }"
    :class="arrastando ? 'select-none **:transition-none' : undefined"
  >
    <AppSidebar
      :usuario="usuario.data.value"
      :prefeitura="prefeitura.data.value.id"
      :largura="largura"
      @alterar-largura="alterar"
      @arrastar="(valor) => (arrastando = valor)"
    />
    <SidebarInset>
      <header
        class="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12"
      >
        <div class="flex items-center gap-2 px-4">
          <SidebarTrigger class="-ml-1" />
          <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <template v-for="(item, indice) in trilha" :key="item.url">
                <BreadcrumbSeparator v-if="indice > 0" />
                <BreadcrumbItem>
                  <BreadcrumbPage v-if="indice === trilha.length - 1">
                    {{ item.titulo }}
                  </BreadcrumbPage>
                  <BreadcrumbLink v-else as-child>
                    <RouterLink :to="primeiraTela(item).url">{{ item.titulo }}</RouterLink>
                  </BreadcrumbLink>
                </BreadcrumbItem>
              </template>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div class="ml-auto px-4">
          <SeletorDeTema />
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4">
        <RouterView />
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
