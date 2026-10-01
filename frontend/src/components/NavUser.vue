<script setup lang="ts">
import { ChevronsUpDown, IdCard, LogOut, UserRound } from '@lucide/vue'
import { ref } from 'vue'

import IdentificacaoDoUsuario from '@/components/IdentificacaoDoUsuario.vue'
import MinhaConta from '@/components/MinhaConta.vue'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { useLogout, type Usuario } from '@/lib/auth'
import { formatarCpf } from '@/lib/cpf'

defineProps<{ usuario: Usuario }>()

const { isMobile } = useSidebar()
const logout = useLogout()
const conta = ref(false)
</script>

<template>
  <SidebarMenu>
    <SidebarMenuItem>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <SidebarMenuButton
            size="lg"
            aria-label="Menu do usuário"
            class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <IdentificacaoDoUsuario :usuario="usuario" />
            <ChevronsUpDown class="ml-auto size-4" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          class="w-(--reka-dropdown-menu-trigger-width) min-w-56 rounded-lg"
          :side="isMobile ? 'bottom' : 'right'"
          align="end"
          :side-offset="4"
        >
          <DropdownMenuLabel class="p-0 font-normal">
            <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
              <IdentificacaoDoUsuario :usuario="usuario" />
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem v-if="usuario.cpf" disabled class="opacity-100">
              <IdCard />
              <span class="font-mono text-xs">{{ formatarCpf(usuario.cpf) }}</span>
            </DropdownMenuItem>
            <DropdownMenuItem @select="conta = true">
              <UserRound />
              Minha conta
            </DropdownMenuItem>
            <DropdownMenuItem
              :disabled="logout.isPending.value"
              variant="destructive"
              @select="logout.mutate()"
            >
              <LogOut />
              Sair
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
      <MinhaConta v-if="conta" :usuario="usuario" @fechar="conta = false" />
    </SidebarMenuItem>
  </SidebarMenu>
</template>
