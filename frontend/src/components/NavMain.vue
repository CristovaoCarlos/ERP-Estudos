<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { useRoute } from 'vue-router'

import NavSubmenu from '@/components/NavSubmenu.vue'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { ativo, type Modulo } from '@/lib/navegacao'
import { cn } from '@/lib/utils'

defineProps<{ modulos: Modulo[] }>()

const route = useRoute()
const { isMobile, setOpenMobile } = useSidebar()
const fecharNoCelular = () => isMobile.value && setOpenMobile(false)

/** Linha entre os módulos do menu principal (menos depois do último). */
const separador = 'border-b border-sidebar-border pb-1 last:border-b-0 last:pb-0'
</script>

<template>
  <SidebarGroup>
    <SidebarMenu>
      <template v-for="modulo in modulos" :key="modulo.url">
        <Collapsible
          v-if="modulo.paginas"
          as-child
          :default-open="ativo(modulo, route.path)"
          :class="cn('group/collapsible', separador)"
        >
          <SidebarMenuItem>
            <CollapsibleTrigger as-child>
              <SidebarMenuButton :tooltip="modulo.titulo" :is-active="ativo(modulo, route.path)">
                <component :is="modulo.icone" />
                <span>{{ modulo.titulo }}</span>
                <ChevronRight
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90"
                />
              </SidebarMenuButton>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <NavSubmenu :paginas="modulo.paginas" @navegar="fecharNoCelular" />
            </CollapsibleContent>
          </SidebarMenuItem>
        </Collapsible>

        <SidebarMenuItem v-else :class="separador">
          <SidebarMenuButton
            as-child
            :tooltip="modulo.titulo"
            :is-active="ativo(modulo, route.path)"
          >
            <RouterLink :to="modulo.url" @click="fecharNoCelular">
              <component :is="modulo.icone" />
              <span>{{ modulo.titulo }}</span>
            </RouterLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </template>
    </SidebarMenu>
  </SidebarGroup>
</template>
