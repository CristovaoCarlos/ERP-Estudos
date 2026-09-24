import { Hash } from 'lucide-react'

import { Listagem, type Coluna } from '@/components/listagem'
import { useNumeracaoDeNotas, type NotaNumeracao } from '@/lib/tabelas-comuns-numeracao-de-notas'

const colunas: Coluna<NotaNumeracao>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono',
    conteudo: (numeracao) => numeracao.codigo,
    busca: (numeracao) => numeracao.codigo,
  },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'font-medium',
    conteudo: (numeracao) => numeracao.descricao,
    busca: (numeracao) => numeracao.descricao,
  },
]

export default function NumeracaoDeNotas() {
  const numeracoes = useNumeracaoDeNotas()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Numeração de Notas</h1>
        <p className="text-muted-foreground">
          Tipos de numeração da nota fiscal.
        </p>
      </div>

      <Listagem
        chave="tabelas-comuns-numeracao-de-notas"
        itens={numeracoes.data}
        carregando={numeracoes.isPending}
        erro={numeracoes.isError}
        colunas={colunas}
        identificador={(numeracao) => numeracao.codigo}
        placeholder="Buscar por código ou descrição…"
        vazio={{
          titulo: 'Nenhum tipo de numeração',
          descricao: 'A tabela de numeração de notas do banco central está vazia.',
          icone: <Hash />,
        }}
      />
    </div>
  )
}
