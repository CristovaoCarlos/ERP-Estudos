import { MapPinned } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Listagem, type Coluna } from '@/components/listagem'
import { Badge } from '@/components/ui/badge'
import { DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'
import { useCidades, type Cidade } from '@/lib/administracao-tabelas-internas-cidades'

const colunas: Coluna<Cidade>[] = [
  {
    id: 'nome',
    titulo: 'Cidade',
    className: 'font-medium',
    conteudo: (cidade) => cidade.nome,
    busca: (cidade) => cidade.nome,
  },
  {
    id: 'uf',
    titulo: 'UF',
    className: 'w-20',
    conteudo: (cidade) => <Badge variant="outline">{cidade.uf}</Badge>,
    busca: (cidade) => cidade.uf,
  },
  {
    id: 'codigo_ibge',
    titulo: 'Código IBGE',
    className: 'w-36 font-mono text-muted-foreground',
    conteudo: (cidade) => cidade.codigo_ibge,
    busca: (cidade) => cidade.codigo_ibge,
  },
]

export default function Cidades() {
  const cidades = useCidades()
  const [ufs, setUfs] = useState<string[]>([])

  const todasAsUfs = useMemo(
    () => [...new Set(cidades.data?.map((cidade) => cidade.uf))].sort(),
    [cidades.data],
  )

  const filtradas = ufs.length
    ? cidades.data?.filter((cidade) => ufs.includes(cidade.uf))
    : cidades.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">Cidades</h1>
        <p className="text-muted-foreground">Todos os Municípios com UF e código IBGE.</p>
      </div>

      <Listagem
        chave="administracao-tabelas-internas-cidades"
        itens={filtradas}
        carregando={cidades.isPending}
        erro={cidades.isError}
        colunas={colunas}
        identificador={(cidade) => cidade.id}
        placeholder="Buscar por cidade, UF ou código IBGE…"
        filtrosAtivos={ufs.length}
        aoLimparFiltros={() => setUfs([])}
        filtros={
          // 27 UFs: a lista rola dentro do menu.
          <div className="max-h-72 overflow-y-auto">
            {todasAsUfs.map((uf) => (
              <DropdownMenuCheckboxItem
                key={uf}
                checked={ufs.includes(uf)}
                onCheckedChange={(marcado) =>
                  setUfs((atuais) =>
                    marcado ? [...atuais, uf] : atuais.filter((atual) => atual !== uf),
                  )
                }
                onSelect={(evento) => evento.preventDefault()}
              >
                {uf}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        }
        vazio={{
          titulo: 'Nenhuma cidade',
          descricao: 'A tabela de cidades do banco central está vazia.',
          icone: <MapPinned />,
        }}
      />
    </div>
  )
}
