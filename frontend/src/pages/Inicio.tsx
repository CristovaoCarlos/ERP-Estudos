import { useQuery } from '@tanstack/react-query'
import { LogOut, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useLogout, useUsuario } from '@/lib/auth'

export default function Inicio() {
  const { resolvedTheme, setTheme } = useTheme()
  const usuario = useUsuario()
  const logout = useLogout()
  const tenant = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => (await api.get<{ id: string }>('/tenant')).data,
  })

  return (
    <main className="mx-auto flex min-h-svh max-w-3xl flex-col gap-6 p-8">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">STM</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{usuario.data?.name}</span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Alternar tema"
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          >
            {resolvedTheme === 'dark' ? <Sun /> : <Moon />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => logout.mutate()}
            disabled={logout.isPending}
          >
            <LogOut />
            Sair
          </Button>
        </div>
      </header>
      <p className="text-muted-foreground">Sistema de Tributação Municipal</p>
      <p className="font-mono text-sm">
        Tenant:{' '}
        {tenant.isPending ? 'carregando…' : tenant.isError ? 'indisponível' : tenant.data.id}
      </p>
    </main>
  )
}
