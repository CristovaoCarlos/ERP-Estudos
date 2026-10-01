<script setup lang="ts">
import { Check, ChevronsUpDown, Landmark } from '@lucide/vue'

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { PrefeituraDoUsuario } from '@/lib/auth'
import { enderecoDoDominio, nomeExibido } from '@/lib/prefeitura'

const props = defineProps<{ atual: string; prefeituras: PrefeituraDoUsuario[] }>()

const { isMobile } = useSidebar()

function trocar(prefeitura: PrefeituraDoUsuario) {
  if (prefeitura.id !== props.atual && prefeitura.dominio) {
    window.location.assign(enderecoDoDominio(prefeitura.dominio))
  }
}
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div
              class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground"
            >
              <Landmark class="size-4" />
            </div>
            <div class="grid flex-1 text-left text-sm leading-tight">
              <span class="truncate font-medium">
                {{
                  nomeExibido(
                    prefeituras.find((prefeitura) => prefeitura.id === atual) ?? { id: atual },
                  )
                }}
              </span>
              <span class="truncate text-xs">ERP para Estudos</span>
            </div>
            <ChevronsUpDown class="ml-auto" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          align="start"
          :side="isMobile ? 'bottom' : 'right'"
          :side-offset="4"
        >
          <DropdownMenuLabel class="text-xs text-muted-foreground">
            Minhas prefeituras
          </DropdownMenuLabel>
          <DropdownMenuGroup>
            <DropdownMenuItem
              v-for="prefeitura in prefeituras"
              :key="prefeitura.id"
              :disabled="!prefeitura.dominio"
              class="gap-2 p-2"
              @select="trocar(prefeitura)"
            >
              <div class="flex size-6 items-center justify-center rounded-md border">
                <Landmark class="size-3.5 shrink-0" />
              </div>
              {{ nomeExibido(prefeitura) }}
              <Check v-if="prefeitura.id === atual" class="ml-auto" />
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  </SidebarMenu>
</template>
