import * as React from 'react'

import { AlcaDoMenu } from '@/components/alca-do-menu'
import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { PrefeituraSwitcher } from '@/components/prefeitura-switcher'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader } from '@/components/ui/sidebar'
import type { Usuario } from '@/lib/auth'
import { menu } from '@/lib/navegacao'

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
      <SidebarHeader>
        <PrefeituraSwitcher atual={prefeitura} prefeituras={usuario.prefeituras} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain modulos={menu} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser usuario={usuario} />
      </SidebarFooter>
      <AlcaDoMenu {...alca} />
    </Sidebar>
  )
}
