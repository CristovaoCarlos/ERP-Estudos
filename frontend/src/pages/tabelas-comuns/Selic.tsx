import { TrendingUp } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Listagem, type Coluna } from '@/components/listagem'
import { DropdownMenuCheckboxItem } from '@/components/ui/dropdown-menu'
import { useSelic, type Selic } from '@/lib/tabelas-comuns-selic'

const nomeDoMes = new Intl.DateTimeFormat('pt-BR', { month: 'long' })
const percentual = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

function mesPorExtenso(mes: number): string {
  const nome = nomeDoMes.format(new Date(2000, mes - 1, 1))
  return nome.charAt(0).toUpperCase() + nome.slice(1)
}

function competencia(selic: Selic): string {
  return `${String(selic.mes).padStart(2, '0')}/${selic.ano}`
}

const colunas: Coluna<Selic>[] = [
  {
    id: 'competencia',
    titulo: 'Competência',
    className: 'w-32 font-mono',
    conteudo: competencia,
    busca: competencia,
  },
  {
    id: 'mes',
    titulo: 'Mês',
    conteudo: (selic) => `${mesPorExtenso(selic.mes)} de ${selic.ano}`,
    busca: (selic) => `${mesPorExtenso(selic.mes)} ${selic.ano}`,
  },
  {
    id: 'valor',
    titulo: 'Taxa',
    className: 'w-32 text-right tabular-nums',
    conteudo: (selic) =>
      selic.valor === null ? (
        <span className="text-muted-foreground">—</span>
      ) : (
        `${percentual.format(Number(selic.valor))}%`
      ),
  },
]

export default function SelicPagina() {
  const selic = useSelic()
  const [anos, setAnos] = useState<number[]>([])

  const todosOsAnos = useMemo(
    () => [...new Set(selic.data?.map((taxa) => taxa.ano))].sort((a, b) => b - a),
    [selic.data],
  )

  const filtradas = anos.length ? selic.data?.filter((taxa) => anos.includes(taxa.ano)) : selic.data

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">SELIC</h1>
        <p className="text-muted-foreground">
          Taxa SELIC de cada mês, usada na correção de tributos.
        </p>
      </div>

      <Listagem
        chave="tabelas-comuns-selic"
        itens={filtradas}
        carregando={selic.isPending}
        erro={selic.isError}
        colunas={colunas}
        identificador={(taxa) => taxa.id}
        placeholder="Buscar por competência ou mês…"
        filtrosAtivos={anos.length}
        aoLimparFiltros={() => setAnos([])}
        filtros={
          <div className="max-h-72 overflow-y-auto">
            {todosOsAnos.map((ano) => (
              <DropdownMenuCheckboxItem
                key={ano}
                checked={anos.includes(ano)}
                onCheckedChange={(marcado) =>
                  setAnos((atuais) =>
                    marcado ? [...atuais, ano] : atuais.filter((atual) => atual !== ano),
                  )
                }
                onSelect={(evento) => evento.preventDefault()}
              >
                {ano}
              </DropdownMenuCheckboxItem>
            ))}
          </div>
        }
        vazio={{
          titulo: 'Nenhuma taxa cadastrada',
          descricao: 'A tabela da SELIC do banco central ainda não tem nenhum mês.',
          icone: <TrendingUp />,
        }}
      />
    </div>
  )
}
