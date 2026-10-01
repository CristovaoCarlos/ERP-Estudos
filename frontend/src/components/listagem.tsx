import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Columns3,
  Filter,
  Search,
  X,
} from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export type Coluna<T> = {
  id: string
  titulo: string
  /** Classes da célula e do cabeçalho (alinhamento, largura). */
  className?: string
  /** Não aparece no menu Colunas nem pode ser escondida (ex.: Ações). */
  fixa?: boolean
  /** Começa desmarcada no menu Colunas. */
  ocultaPorPadrao?: boolean
  conteudo: (item: T) => ReactNode
  /** Texto considerado na busca rápida. Sem isso, a coluna não é pesquisada. */
  busca?: (item: T) => string | null | undefined
}

const POR_PAGINA = [15, 30, 50, 100]

/** Rodapé da listagem: total de registros, tamanho da página e navegação. */
function Paginacao({
  total,
  pagina,
  paginas,
  porPagina,
  aoMudarPagina,
  aoMudarPorPagina,
}: {
  total: number
  pagina: number
  paginas: number
  porPagina: number
  aoMudarPagina: (pagina: number) => void
  aoMudarPorPagina: (quantidade: number) => void
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-muted/40 px-3 py-2 text-sm">
      <span className="text-muted-foreground">
        {total} {total === 1 ? 'registro' : 'registros'}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Por página</span>
          <Select
            value={String(porPagina)}
            onValueChange={(valor) => aoMudarPorPagina(Number(valor))}
          >
            <SelectTrigger size="sm" className="w-20 bg-background" aria-label="Por página">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POR_PAGINA.map((quantidade) => (
                <SelectItem key={quantidade} value={String(quantidade)}>
                  {quantidade}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <span className="text-muted-foreground">
          Página {pagina} de {paginas}
        </span>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Primeira página"
            disabled={pagina === 1}
            onClick={() => aoMudarPagina(1)}
          >
            <ChevronsLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Página anterior"
            disabled={pagina === 1}
            onClick={() => aoMudarPagina(pagina - 1)}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Próxima página"
            disabled={pagina === paginas}
            onClick={() => aoMudarPagina(pagina + 1)}
          >
            <ChevronRight />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="size-8"
            aria-label="Última página"
            disabled={pagina === paginas}
            onClick={() => aoMudarPagina(paginas)}
          >
            <ChevronsRight />
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Colunas escondidas ficam lembradas no navegador, por tela. */
function useColunasVisiveis<T>(chave: string, colunas: Coluna<T>[]) {
  const armazenamento = `erp_estudos.colunas.${chave}`
  const [escondidas, setEscondidas] = useState<string[]>(() => {
    try {
      const salvo = localStorage.getItem(armazenamento)
      if (salvo) return JSON.parse(salvo) as string[]
    } catch {
      // Navegador sem acesso ao armazenamento: usa o padrão da tela.
    }
    return colunas.filter((coluna) => coluna.ocultaPorPadrao).map((coluna) => coluna.id)
  })

  const alternar = (id: string) =>
    setEscondidas((atuais) => {
      const novas = atuais.includes(id) ? atuais.filter((atual) => atual !== id) : [...atuais, id]
      try {
        localStorage.setItem(armazenamento, JSON.stringify(novas))
      } catch {
        // Sem armazenamento, a escolha vale só nesta visita.
      }
      return novas
    })

  return { escondidas, alternar }
}

/**
 * Listagem padrão do sistema: busca rápida à esquerda, filtros e colunas à direita, e a tabela
 * abaixo. Toda tela de listagem deve usar este componente.
 */
export function Listagem<T>({
  chave,
  itens,
  carregando,
  erro,
  colunas,
  identificador,
  placeholder = 'Buscar…',
  filtros,
  filtrosAtivos = 0,
  aoLimparFiltros,
  acoes,
  vazio,
  aoDestacar,
}: {
  /** Identifica a tela para lembrar as colunas escolhidas. */
  chave: string
  itens: T[] | undefined
  carregando: boolean
  erro?: boolean
  colunas: Coluna<T>[]
  identificador: (item: T) => string | number
  placeholder?: string
  /** Conteúdo do menu Filtros. */
  filtros?: ReactNode
  filtrosAtivos?: number
  aoLimparFiltros?: () => void
  /** Controles extras, entre a busca e os filtros (ex.: um seletor). */
  acoes?: ReactNode
  vazio?: { titulo: string; descricao: string; icone: ReactNode }
  /** Classes da linha (ex.: esmaecer inativos). */
  aoDestacar?: (item: T) => string | undefined
}) {
  const [busca, setBusca] = useState('')
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState(POR_PAGINA[0])
  const { escondidas, alternar } = useColunasVisiveis(chave, colunas)
  const visiveis = colunas.filter((coluna) => !escondidas.includes(coluna.id))

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo || !itens) return itens
    return itens.filter((item) =>
      colunas.some((coluna) => coluna.busca?.(item)?.toLowerCase().includes(termo)),
    )
  }, [busca, itens, colunas])

  const total = filtrados?.length ?? 0
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  // Busca ou filtro novo pode encurtar a lista: a página nunca passa da última.
  const paginaAtual = Math.min(pagina, paginas)
  const daPagina = filtrados?.slice((paginaAtual - 1) * porPagina, paginaAtual * porPagina)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border bg-muted/40 p-3">
        <InputGroup className="w-full bg-background sm:w-80">
          <InputGroupAddon>
            <Search className="size-4 text-muted-foreground" />
          </InputGroupAddon>
          <InputGroupInput
            aria-label="Busca rápida"
            placeholder={placeholder}
            value={busca}
            onChange={(evento) => {
              setBusca(evento.target.value)
              setPagina(1)
            }}
          />
        </InputGroup>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {acoes}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter />
                Filtros
                {filtrosAtivos > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {filtrosAtivos}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>Filtros</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {filtros ?? (
                <p className="px-2 py-1.5 text-sm text-muted-foreground">
                  Esta tela ainda não tem filtros.
                </p>
              )}
              {filtrosAtivos > 0 && aoLimparFiltros && (
                <>
                  <DropdownMenuSeparator />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={aoLimparFiltros}
                  >
                    <X />
                    Limpar filtros
                  </Button>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Columns3 />
                Colunas
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Colunas</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {colunas
                .filter((coluna) => !coluna.fixa)
                .map((coluna) => (
                  <DropdownMenuCheckboxItem
                    key={coluna.id}
                    checked={!escondidas.includes(coluna.id)}
                    onCheckedChange={() => alternar(coluna.id)}
                    onSelect={(evento) => evento.preventDefault()}
                  >
                    {coluna.titulo}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {erro ? (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar a lista</AlertTitle>
          <AlertDescription>Tente novamente em alguns instantes.</AlertDescription>
        </Alert>
      ) : filtrados?.length === 0 ? (
        <Empty className="border border-dashed">
          <EmptyHeader>
            {busca ? (
              <>
                <EmptyMedia variant="icon">
                  <Search />
                </EmptyMedia>
                <EmptyTitle>Nada encontrado</EmptyTitle>
                <EmptyDescription>Nenhum resultado para “{busca}”.</EmptyDescription>
              </>
            ) : (
              vazio && (
                <>
                  <EmptyMedia variant="icon">{vazio.icone}</EmptyMedia>
                  <EmptyTitle>{vazio.titulo}</EmptyTitle>
                  <EmptyDescription>{vazio.descricao}</EmptyDescription>
                </>
              )
            )}
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {visiveis.map((coluna) => (
                  <TableHead key={coluna.id} className={coluna.className}>
                    {coluna.titulo}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {carregando
                ? Array.from({ length: 3 }, (_, linha) => (
                    <TableRow key={linha}>
                      {visiveis.map((coluna) => (
                        <TableCell key={coluna.id}>
                          <Skeleton className="h-4 w-full" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                : daPagina?.map((item) => (
                    <TableRow key={identificador(item)} className={aoDestacar?.(item)}>
                      {visiveis.map((coluna) => (
                        <TableCell key={coluna.id} className={coluna.className}>
                          {coluna.conteudo(item)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
            </TableBody>
          </Table>
          <Paginacao
            total={total}
            pagina={paginaAtual}
            paginas={paginas}
            porPagina={porPagina}
            aoMudarPagina={setPagina}
            aoMudarPorPagina={(quantidade) => {
              setPorPagina(quantidade)
              setPagina(1)
            }}
          />
        </div>
      )}
    </div>
  )
}
