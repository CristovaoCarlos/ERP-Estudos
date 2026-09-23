import { Check, ChevronsUpDown, Landmark } from 'lucide-react'

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

export function PrefeituraSwitcher({
  atual,
  prefeituras,
}: {
  atual: string
  prefeituras: PrefeituraDoUsuario[]
}) {
  const { isMobile } = useSidebar()

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Landmark className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {nomeExibido(
                    prefeituras.find((prefeitura) => prefeitura.id === atual) ?? { id: atual },
                  )}
                </span>
                <span className="truncate text-xs">STM</span>
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Minhas prefeituras
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              {prefeituras.map((prefeitura) => (
                <DropdownMenuItem
                  key={prefeitura.id}
                  disabled={!prefeitura.dominio}
                  onSelect={() => {
                    if (prefeitura.id !== atual && prefeitura.dominio) {
                      window.location.assign(enderecoDoDominio(prefeitura.dominio))
                    }
                  }}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <Landmark className="size-3.5 shrink-0" />
                  </div>
                  {nomeExibido(prefeitura)}
                  {prefeitura.id === atual && <Check className="ml-auto" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
