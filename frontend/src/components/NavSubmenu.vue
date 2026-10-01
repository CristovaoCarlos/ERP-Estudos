<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import { useRoute } from 'vue-router'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem } from '@/components/ui/sidebar'
import { ativo, type Pagina } from '@/lib/navegacao'
import { cn } from '@/lib/utils'

/** Telas de um módulo ou submenu; submenus dentro dele abrem outro `NavSubmenu`. */
defineProps<{ paginas: Pagina[]; aninhado?: boolean }>()
const emit = defineEmits<{ navegar: [] }>()

const route = useRoute()
</script>

<template>
  <SidebarMenuSub :class="cn(aninhado && 'mr-0 pr-0')">
    <template v-for="pagina in paginas" :key="pagina.url">
      <Collapsible
        v-if="pagina.paginas"
        as-child
        :default-open="ativo(pagina, route.path)"
        class="group/submenu"
      >
        <SidebarMenuSubItem>
          <CollapsibleTrigger as-child>
            <SidebarMenuSubButton as-child>
              <button type="button" class="w-full">
                <component :is="pagina.icone" />
                <span class="truncate">{{ pagina.titulo }}</span>
                <ChevronRight
                  class="ml-auto transition-transform duration-200 group-data-[state=open]/submenu:rotate-90"
                />
              </button>
            </SidebarMenuSubButton>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <NavSubmenu :paginas="pagina.paginas" aninhado @navegar="emit('navegar')" />
          </CollapsibleContent>
        </SidebarMenuSubItem>
      </Collapsible>

      <SidebarMenuSubItem v-else>
        <SidebarMenuSubButton as-child :is-active="route.path === pagina.url">
          <RouterLink :to="pagina.url" :title="pagina.titulo" @click="emit('navegar')">
            <component :is="pagina.icone" />
            <span>{{ pagina.titulo }}</span>
          </RouterLink>
        </SidebarMenuSubButton>
      </SidebarMenuSubItem>
    </template>
  </SidebarMenuSub>
</template>
