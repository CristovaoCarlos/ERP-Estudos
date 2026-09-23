import { ShieldX } from 'lucide-react'
import type { ReactNode } from 'react'

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useUsuario } from '@/lib/auth'
import { podeAcessar } from '@/lib/navegacao'

/** Mostra a tela só para quem tem a permissão dela (ver `permissaoDaTela`). */
export default function Tela({ url, children }: { url: string; children: ReactNode }) {
  const usuario = useUsuario()

  if (!podeAcessar(url, usuario.data?.permissoes ?? [])) {
    return (
      <Empty className="flex-1 border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <ShieldX />
          </EmptyMedia>
          <EmptyTitle>Sem acesso</EmptyTitle>
          <EmptyDescription>
            Você não tem permissão para esta tela. Fale com o administrador da sua prefeitura.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  return children
}
