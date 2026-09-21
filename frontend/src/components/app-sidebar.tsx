import * as React from 'react'

import { NavMain } from '@/components/nav-main'
import { NavUser } from '@/components/nav-user'
import { PrefeituraSwitcher } from '@/components/prefeitura-switcher'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import type { Usuario } from '@/lib/auth'
import { menu } from '@/lib/navegacao'

export function AppSidebar({
  usuario,
  prefeitura,
  ...props
}: React.ComponentProps<typeof Sidebar> & { usuario: Usuario; prefeitura: string }) {
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
      <SidebarRail />
    </Sidebar>
  )
}
