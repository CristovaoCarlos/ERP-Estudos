import { Fragment } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'
import { useUsuario } from '@/lib/auth'
import { localizar, type Pagina } from '@/lib/navegacao'
import { subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'

export default function AppLayout() {
  const { pathname } = useLocation()
  const usuario = useUsuario()
  const prefeitura = usePrefeitura(subdominioDaPrefeitura())
  const { modulo, pagina } = localizar(pathname)
  const trilha: Pagina[] = [modulo, pagina].filter((item): item is Pagina => item !== undefined)

  if (!usuario.data || !prefeitura.data) return null

  return (
    <SidebarProvider>
      <AppSidebar usuario={usuario.data} prefeitura={prefeitura.data.id} />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                {trilha.map((item, indice) => (
                  <Fragment key={item.url}>
                    {indice > 0 && <BreadcrumbSeparator />}
                    <BreadcrumbItem>
                      {indice === trilha.length - 1 ? (
                        <BreadcrumbPage>{item.titulo}</BreadcrumbPage>
                      ) : (
                        <BreadcrumbLink asChild>
                          <Link to={modulo?.paginas?.[0]?.url ?? item.url}>{item.titulo}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
