<script setup lang="ts">
import AlcaDoMenu from '@/components/AlcaDoMenu.vue'
import NavMain from '@/components/NavMain.vue'
import NavUser from '@/components/NavUser.vue'
import PrefeituraSwitcher from '@/components/PrefeituraSwitcher.vue'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import type { Usuario } from '@/lib/auth'
import { menuPermitido } from '@/lib/navegacao'

defineProps<{ usuario: Usuario; prefeitura: string; largura: number }>()
const emit = defineEmits<{ alterarLargura: [largura: number]; arrastar: [arrastando: boolean] }>()
</script>

<template>
  <Sidebar collapsible="icon">
    <!-- Mesma altura e borda do cabeçalho da página: a linha divisória atravessa a tela toda. -->
    <SidebarHeader
      class="h-16 justify-center border-b border-border transition-[height] ease-linear group-data-[collapsible=icon]:h-12"
    >
      <PrefeituraSwitcher :atual="prefeitura" :prefeituras="usuario.prefeituras" />
    </SidebarHeader>
    <SidebarContent>
      <NavMain :modulos="menuPermitido(usuario.permissoes)" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser :usuario="usuario" />
    </SidebarFooter>
    <AlcaDoMenu
      :largura="largura"
      @alterar="(valor) => emit('alterarLargura', valor)"
      @arrastar="(valor) => emit('arrastar', valor)"
    />
  </Sidebar>
</template>
