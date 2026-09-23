import { ChevronsUpDown, IdCard, LogOut, UserRound } from 'lucide-react'
import { useState } from 'react'

import { MinhaConta } from '@/components/minha-conta'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
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
import { formatarCpf } from '@/lib/cpf'
import { iniciais, useLogout, type Usuario } from '@/lib/auth'

function Identificacao({ usuario }: { usuario: Usuario }) {
  return (
    <>
      <Avatar className="size-8 rounded-lg">
        {usuario.foto && <AvatarImage src={usuario.foto} alt="" className="rounded-lg" />}
        <AvatarFallback className="rounded-lg">{iniciais(usuario.name)}</AvatarFallback>
      </Avatar>
      <div className="grid flex-1 text-left text-sm leading-tight">
        <span className="truncate font-medium">{usuario.name}</span>
        <span className="truncate text-xs">{usuario.email}</span>
      </div>
    </>
  )
}

export function NavUser({ usuario }: { usuario: Usuario }) {
  const { isMobile } = useSidebar()
  const logout = useLogout()
  const [conta, setConta] = useState(false)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              aria-label="Menu do usuário"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Identificacao usuario={usuario} />
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Identificacao usuario={usuario} />
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              {usuario.cpf && (
                <DropdownMenuItem disabled className="opacity-100">
                  <IdCard />
                  <span className="font-mono text-xs">{formatarCpf(usuario.cpf)}</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onSelect={() => setConta(true)}>
                <UserRound />
                Minha conta
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled={logout.isPending}
                onSelect={() => logout.mutate()}
                variant="destructive"
              >
                <LogOut />
                Sair
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        {conta && <MinhaConta usuario={usuario} aoFechar={() => setConta(false)} />}
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
