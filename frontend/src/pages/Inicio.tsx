import { Link } from 'react-router-dom'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useUsuario } from '@/lib/auth'
import { menu } from '@/lib/navegacao'
import { nomeDaPrefeitura, subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'

export default function Inicio() {
  const usuario = useUsuario()
  const prefeitura = usePrefeitura(subdominioDaPrefeitura())
  const modulos = menu.filter((modulo) => modulo.url !== '/')

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Olá, {usuario.data?.name.split(' ')[0]}
        </h1>
        <p className="text-muted-foreground">
          {prefeitura.data && nomeDaPrefeitura(prefeitura.data.id)} · Sistema de Tributação
          Municipal
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {modulos.map((modulo) => (
          <Link
            key={modulo.url}
            to={modulo.paginas?.[0]?.url ?? modulo.url}
            className="rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
          >
            <Card className="h-full transition-colors hover:bg-accent">
              <CardHeader>
                <modulo.icone className="text-muted-foreground" />
                <CardTitle>{modulo.titulo}</CardTitle>
                <CardDescription>
                  {modulo.paginas
                    ? modulo.paginas.map((pagina) => pagina.titulo).join(' · ')
                    : 'Abrir módulo'}
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
