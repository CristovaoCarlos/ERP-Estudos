import { ChevronRight } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from '@/components/ui/sidebar'
import { ativo, type Modulo, type Pagina } from '@/lib/navegacao'
import { cn } from '@/lib/utils'

const seta = 'ml-auto transition-transform duration-200'

/** Linha entre os módulos do menu principal (menos depois do último). */
const separador = 'border-b border-sidebar-border pb-1 last:border-b-0 last:pb-0'

export function NavMain({ modulos }: { modulos: Modulo[] }) {
  const { pathname } = useLocation()
  const { isMobile, setOpenMobile } = useSidebar()
  const fecharNoCelular = () => isMobile && setOpenMobile(false)

  return (
    <SidebarGroup>
      <SidebarMenu>
        {modulos.map((modulo) =>
          modulo.paginas ? (
            <Collapsible
              key={modulo.url}
              asChild
              defaultOpen={ativo(modulo, pathname)}
              className={cn('group/collapsible', separador)}
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={modulo.titulo} isActive={ativo(modulo, pathname)}>
                    <modulo.icone />
                    <span>{modulo.titulo}</span>
                    <ChevronRight
                      className={cn(seta, 'group-data-[state=open]/collapsible:rotate-90')}
                    />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Submenu paginas={modulo.paginas} aoNavegar={fecharNoCelular} />
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : (
            <SidebarMenuItem key={modulo.url} className={separador}>
              <SidebarMenuButton asChild tooltip={modulo.titulo} isActive={ativo(modulo, pathname)}>
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

function Submenu({
  paginas,
  aoNavegar,
  aninhado = false,
}: {
  paginas: Pagina[]
  aoNavegar: () => void
  aninhado?: boolean
}) {
  const { pathname } = useLocation()

  return (
    <SidebarMenuSub className={cn(aninhado && 'mr-0 pr-0')}>
      {paginas.map((pagina) =>
        pagina.paginas ? (
          <Collapsible
            key={pagina.url}
            asChild
            defaultOpen={ativo(pagina, pathname)}
            className="group/submenu"
          >
            <SidebarMenuSubItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuSubButton asChild>
                  <button type="button" className="w-full">
                    <pagina.icone />
                    <span className="truncate">{pagina.titulo}</span>
                    <ChevronRight
                      className={cn(seta, 'group-data-[state=open]/submenu:rotate-90')}
                    />
                  </button>
                </SidebarMenuSubButton>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <Submenu paginas={pagina.paginas} aoNavegar={aoNavegar} aninhado />
              </CollapsibleContent>
            </SidebarMenuSubItem>
          </Collapsible>
        ) : (
          <SidebarMenuSubItem key={pagina.url}>
            <SidebarMenuSubButton asChild isActive={pathname === pagina.url}>
              <Link to={pagina.url} title={pagina.titulo} onClick={aoNavegar}>
                <pagina.icone />
                <span>{pagina.titulo}</span>
              </Link>
            </SidebarMenuSubButton>
          </SidebarMenuSubItem>
        ),
      )}
    </SidebarMenuSub>
  )
}
