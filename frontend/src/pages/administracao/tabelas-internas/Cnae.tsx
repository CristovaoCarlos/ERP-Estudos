import { ListTree } from 'lucide-react'
import { useMemo, useState } from 'react'

import { Listagem, type Coluna } from '@/components/listagem'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { niveis, useCnae, type Cnae, type Nivel } from '@/lib/administracao-tabelas-internas-cnae'

const rotuloDoNivel = Object.fromEntries(niveis.map(({ valor, rotulo }) => [valor, rotulo]))

/** Recuo da denominação conforme o nível, para a hierarquia aparecer na lista. */
const recuo: Record<Nivel, string> = {
  secao: 'font-semibold',
  divisao: 'pl-3 font-medium',
  grupo: 'pl-6',
  classe: 'pl-9',
  subclasse: 'pl-12 text-muted-foreground',
}

const colunas: Coluna<Cnae>[] = [
  {
    id: 'codigo',
    titulo: 'Código',
    className: 'w-28 font-mono whitespace-nowrap',
    conteudo: (cnae) => cnae.codigo,
    busca: (cnae) => `${cnae.codigo} ${cnae.codigo.replace(/\D/g, '')}`,
  },
  {
    id: 'denominacao',
    titulo: 'Denominação',
    conteudo: (cnae) => <span className={recuo[cnae.nivel]}>{cnae.denominacao}</span>,
    busca: (cnae) => cnae.denominacao,
  },
  {
    id: 'nivel',
    titulo: 'Nível',
    className: 'w-28',
    conteudo: (cnae) => <Badge variant="outline">{rotuloDoNivel[cnae.nivel]}</Badge>,
  },
  {
    id: 'secao',
    titulo: 'Seção',
    className: 'w-20',
    ocultaPorPadrao: true,
    conteudo: (cnae) => cnae.secao,
  },
  {
    id: 'versao',
    titulo: 'Versão',
    className: 'w-20 text-muted-foreground',
    conteudo: (cnae) => cnae.versao ?? '—',
  },
  {
    id: 'situacao',
    titulo: 'Situação',
    className: 'w-24',
    conteudo: (cnae) =>
      cnae.ativo ? (
        <Badge variant="secondary">Ativa</Badge>
      ) : (
        <Badge variant="outline">Inativa</Badge>
      ),
  },
]

type Situacao = 'ativa' | 'inativa'

/** Liga e desliga um valor numa lista de filtros marcados. */
function alternar<T>(lista: T[], valor: T, marcado: boolean): T[] {
  return marcado ? [...lista, valor] : lista.filter((atual) => atual !== valor)
}

export default function CnaePagina() {
  const cnae = useCnae()
  const [versoes, setVersoes] = useState<string[]>([])
  const [niveisMarcados, setNiveisMarcados] = useState<Nivel[]>([])
  const [situacoes, setSituacoes] = useState<Situacao[]>([])

  const todasAsVersoes = useMemo(
    () =>
      [...new Set(cnae.data?.map((atividade) => atividade.versao ?? ''))]
        .filter(Boolean)
        .sort()
        .reverse(),
    [cnae.data],
  )

  const filtradas = cnae.data?.filter(
    (atividade) =>
      (!versoes.length || versoes.includes(atividade.versao ?? '')) &&
      (!niveisMarcados.length || niveisMarcados.includes(atividade.nivel)) &&
      (!situacoes.length || situacoes.includes(atividade.ativo ? 'ativa' : 'inativa')),
  )

  const item = (rotulo: string, marcado: boolean, aoMudar: (marcado: boolean) => void) => (
    <DropdownMenuCheckboxItem
      key={rotulo}
      checked={marcado}
      onCheckedChange={aoMudar}
      onSelect={(evento) => evento.preventDefault()}
    >
      {rotulo}
    </DropdownMenuCheckboxItem>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight">CNAE</h1>
        <p className="text-muted-foreground">
          Classificação Nacional de Atividades Econômicas, da seção à subclasse. A tabela é a mesma
          para todas as prefeituras.
        </p>
      </div>

      <Listagem
        chave="administracao-tabelas-internas-cnae"
        itens={filtradas}
        carregando={cnae.isPending}
        erro={cnae.isError}
        colunas={colunas}
        identificador={(atividade) => atividade.id}
        placeholder="Buscar por código ou denominação…"
        filtrosAtivos={versoes.length + niveisMarcados.length + situacoes.length}
        aoLimparFiltros={() => {
          setVersoes([])
          setNiveisMarcados([])
          setSituacoes([])
        }}
        filtros={
          <>
            <DropdownMenuLabel className="text-xs text-muted-foreground">Versão</DropdownMenuLabel>
            {todasAsVersoes.map((versao) =>
              item(versao, versoes.includes(versao), (marcado) =>
                setVersoes((atuais) => alternar(atuais, versao, marcado)),
              ),
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">Nível</DropdownMenuLabel>
            {niveis.map(({ valor, rotulo }) =>
              item(rotulo, niveisMarcados.includes(valor), (marcado) =>
                setNiveisMarcados((atuais) => alternar(atuais, valor, marcado)),
              ),
            )}
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Situação
            </DropdownMenuLabel>
            {item('Ativa', situacoes.includes('ativa'), (marcado) =>
              setSituacoes((atuais) => alternar(atuais, 'ativa', marcado)),
            )}
            {item('Inativa', situacoes.includes('inativa'), (marcado) =>
              setSituacoes((atuais) => alternar(atuais, 'inativa', marcado)),
            )}
          </>
        }
        vazio={{
          titulo: 'Nenhuma atividade',
          descricao: 'A tabela da CNAE do banco central está vazia.',
          icone: <ListTree />,
        }}
      />
    </div>
  )
}
