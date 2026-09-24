import { Landmark } from 'lucide-react'

import { Listagem, type Coluna } from '@/components/listagem'
import { useBancos, type Banco } from '@/lib/administracao-tabelas-internas-bancos'

const colunas: Coluna<Banco>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono text-muted-foreground',
    conteudo: (banco) => banco.codigo,
    busca: (banco) => banco.codigo,
  },
  {
    id: 'nome',
    titulo: 'Banco',
    className: 'font-medium',
    conteudo: (banco) => banco.nome,
    busca: (banco) => banco.nome,
  },
]

export default function Bancos() {
  const bancos = useBancos()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Bancos</h1>
        <p className="text-muted-foreground">
          Bancos com o código de compensação. A tabela é a mesma para todas as prefeituras.
        </p>
      </div>

      <Listagem
        chave="administracao-tabelas-internas-bancos"
        itens={bancos.data}
        carregando={bancos.isPending}
        erro={bancos.isError}
        colunas={colunas}
        identificador={(banco) => banco.id}
        placeholder="Buscar por código ou nome…"
        vazio={{
          titulo: 'Nenhum banco',
          descricao: 'A tabela de bancos do banco central está vazia.',
          icone: <Landmark />,
        }}
      />
    </div>
  )
}
