import { FileType } from 'lucide-react'

import { Listagem, type Coluna } from '@/components/listagem'
import { useTiposDeDam, type DamTipo } from '@/lib/tabelas-comuns-tipos-de-dam'

const colunas: Coluna<DamTipo>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-24 font-mono',
    conteudo: (tipo) => tipo.codigo,
    busca: (tipo) => String(tipo.codigo),
  },
  {
    id: 'descricao',
    titulo: 'Descrição',
    className: 'font-medium',
    conteudo: (tipo) => tipo.descricao,
    busca: (tipo) => tipo.descricao,
  },
]

export default function TiposDeDam() {
  const tipos = useTiposDeDam()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Tipos de DAM</h1>
        <p className="text-muted-foreground">Tipos de documento de arrecadação.</p>
      </div>

      <Listagem
        chave="tabelas-comuns-tipos-de-dam"
        itens={tipos.data}
        carregando={tipos.isPending}
        erro={tipos.isError}
        colunas={colunas}
        identificador={(tipo) => tipo.codigo}
        placeholder="Buscar por código ou descrição…"
        vazio={{
          titulo: 'Nenhum tipo de DAM',
          descricao: 'A tabela de tipos de DAM do banco central está vazia.',
          icone: <FileType />,
        }}
      />
    </div>
  )
}
