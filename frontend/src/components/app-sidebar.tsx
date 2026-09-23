import * as React from 'react'

import { AlcaDoMenu } from '@/components/alca-do-menu'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { PrefeituraSwitcher } from '@/components/prefeitura-switcher'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import type { Usuario } from '@/lib/auth'
import { menuPermitido } from '@/lib/navegacao'

export function AppSidebar({
  usuario,
  prefeitura,
  alca,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  usuario: Usuario
  prefeitura: string
  alca: React.ComponentProps<typeof AlcaDoMenu>
}) {
  return (
    <Sidebar collapsible="icon" {...props}>
      {/* Mesma altura e borda do cabeçalho da página: a linha divisória atravessa a tela toda. */}
      <SidebarHeader className="h-16 justify-center border-b border-border transition-[height] ease-linear group-data-[collapsible=icon]:h-12">
        <PrefeituraSwitcher atual={prefeitura} prefeituras={usuario.prefeituras} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain modulos={menuPermitido(usuario.permissoes)} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser usuario={usuario} />
      </SidebarFooter>
      <AlcaDoMenu {...alca} />
    </Sidebar>
  )
}
