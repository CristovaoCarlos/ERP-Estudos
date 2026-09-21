import { Construction } from 'lucide-react'
import { useLocation } from 'react-router-dom'

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { localizar } from '@/lib/navegacao'

export default function EmConstrucao() {
  const { modulo, pagina } = localizar(useLocation().pathname)
  const titulo = pagina?.titulo ?? modulo?.titulo ?? 'Página'

  return (
    <Empty className="flex-1 border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Construction />
        </EmptyMedia>
        <EmptyTitle>{titulo}</EmptyTitle>
        <EmptyDescription>Esta tela ainda está em construção.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
