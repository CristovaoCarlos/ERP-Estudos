import { Fragment, useState, type CSSProperties } from 'react'
import { Link, Outlet, useLocation } from 'react-router-dom'

import { AppSidebar } from '@/components/app-sidebar'
import { SeletorDeTema } from '@/components/seletor-de-tema'
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
import { useLarguraDoMenu } from '@/hooks/use-largura-do-menu'
import { useUsuario } from '@/lib/auth'
import { localizar, primeiraTela } from '@/lib/navegacao'
import { subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'

export default function AppLayout() {
  const { pathname } = useLocation()
  const usuario = useUsuario()
  const prefeitura = usePrefeitura(subdominioDaPrefeitura())
  const trilha = localizar(pathname)
  const [largura, setLargura] = useLarguraDoMenu()
  const [arrastando, setArrastando] = useState(false)

  if (!usuario.data || !prefeitura.data) return null

  return (
    <SidebarProvider
      style={{ '--sidebar-width': `${largura}px` } as CSSProperties}
      // Sem animação nem seleção de texto enquanto arrasta a borda do menu.
      className={arrastando ? 'select-none **:transition-none' : undefined}
    >
      <AppSidebar
        usuario={usuario.data}
        prefeitura={prefeitura.data.id}
        alca={{ largura, aoAlterar: setLargura, aoArrastar: setArrastando }}
      />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
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
                          <Link to={primeiraTela(item).url}>{item.titulo}</Link>
                        </BreadcrumbLink>
                      )}
                    </BreadcrumbItem>
                  </Fragment>
                ))}
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4">
            <SeletorDeTema />
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
