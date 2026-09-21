import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { moduloAtivo, type Modulo } from '@/lib/navegacao'

export function NavMain({ modulos }: { modulos: Modulo[] }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const fecharNoCelular = () => isMobile && setOpenMobile(false)

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Módulos</SidebarGroupLabel>
      <SidebarMenu>
        {modulos.map((modulo) =>
          modulo.paginas ? (
            <Collapsible
              key={modulo.url}
              asChild
              defaultOpen={moduloAtivo(modulo, pathname)}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton
                    tooltip={modulo.titulo}
                    isActive={moduloAtivo(modulo, pathname)}
                  >
                    <modulo.icone />
                    <span>{modulo.titulo}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {modulo.paginas.map((pagina) => (
                      <SidebarMenuSubItem key={pagina.url}>
                        <SidebarMenuSubButton asChild isActive={pathname === pagina.url}>
                          <Link to={pagina.url} onClick={fecharNoCelular}>
                            <span>{pagina.titulo}</span>
                          </Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={modulo.url}>
              <SidebarMenuButton
                asChild
                tooltip={modulo.titulo}
                isActive={moduloAtivo(modulo, pathname)}
              >
                <Link to={modulo.url} onClick={fecharNoCelular}>
                  <modulo.icone />
                  <span>{modulo.titulo}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ),
        )}
      </SidebarMenu>
    </SidebarGroup>
  )
}
