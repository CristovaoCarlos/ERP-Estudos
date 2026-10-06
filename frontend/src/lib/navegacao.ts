import {
  ArrowLeftRight,
  BadgeCheck,
  BadgePercent,
  BadgeX,
  Banknote,
  Briefcase,
  Calculator,
  ChartColumn,
  CircleDollarSign,
  ClipboardList,
  Coins,
  Contact,
  Database,
  FileCheck,
  FileInput,
  FileOutput,
  FilePlus,
  FileText,
  FileType,
  FileX,
  Globe,
  HandCoins,
  Handshake,
  Hash,
  History,
  House,
  IdCard,
  KeyRound,
  Landmark,
  List,
  ListChecks,
  ListOrdered,
  ListTree,
  LockKeyhole,
  MapPin,
  MapPinned,
  Percent,
  Receipt,
  ReceiptText,
  Scale,
  Search,
  Settings2,
  Shapes,
  ShieldCheck,
  SlidersHorizontal,
  Stamp,
  Store,
  Table2,
  Tags,
  Tractor,
  TrendingUp,
  User,
  UserCheck,
  UserCog,
  UserRound,
  Users,
  Wrench,
  type LucideIcon,
} from '@lucide/vue'

/** Tela do menu. Com `paginas`, vira um submenu (que pode ter outros submenus dentro). */
export type Pagina = { titulo: string; url: string; icone: LucideIcon; paginas?: Pagina[] }

/** Item do primeiro nível do menu. */
export type Modulo = Pagina

export const menu: Modulo[] = [
  { titulo: 'Início', url: '/', icone: House },
  // {
  //   titulo: 'Tabelas',
  //   url: '/tabelas',
  //   icone: Table2,
  //   paginas: [
  //     {
  //       titulo: 'Tomadores de Serviço',
  //       url: '/tabelas/tomadores',
  //       icone: UserCheck,
  //       paginas: [
  //         { titulo: 'Tomador', url: '/tabelas/tomadores/tomador', icone: UserRound },
  //         { titulo: 'Tomador estrangeiro', url: '/tabelas/tomadores/estrangeiro', icone: Globe },
  //       ],
  //     },
  //     { titulo: 'Tipo de Alvará', url: '/tabelas/tipos-de-alvara', icone: Tags },
  //     { titulo: 'Natureza ITBI', url: '/tabelas/natureza-itbi', icone: ArrowLeftRight },
  //     { titulo: 'Fatores de Localização', url: '/tabelas/fatores-de-localizacao', icone: MapPin },
  //     { titulo: 'Cadastro de Isenções', url: '/tabelas/isencoes', icone: BadgePercent },
  //     { titulo: 'Cartório', url: '/tabelas/cartorios', icone: Stamp },
  //     {
  //       titulo: 'Modelos de Certidão Negativa',
  //       url: '/tabelas/modelos-certidao-negativa',
  //       icone: FileCheck,
  //     },
  //     {
  //       titulo: 'Modelos Histórico Nota Fiscal',
  //       url: '/tabelas/modelos-historico-nota-fiscal',
  //       icone: History,
  //     },
  //   ],
  // },
  {
    titulo: 'Cadastros',
    url: '/cadastros',
    icone: Receipt,
    paginas: [
      { titulo: 'Clientes', url: '/cadastros/clientes', icone: FilePlus },
      { titulo: 'Produtos', url: '/cadastros/produtos', icone: FilePlus },
      { titulo: 'Vendedores', url: '/cadastros/vendedores', icone: ReceiptText },
    ],
  },
  {
    titulo: 'Lançamentos',
    url: '/lançamentos',
    icone: Receipt,
    paginas: [
      { titulo: 'Vendas', url: '/lancamentos/vendas', icone: FilePlus },
    ],
  },
  {
    titulo: 'Relatórios',
    url: '/relatorios',
    icone: FileText,
    paginas: [
      { titulo: 'Relatório de Vendas no Período', url: '/relatorios/vendas_periodo', icone: TrendingUp },
    ],
  },
  {
    titulo: 'Administração',
    url: '/administracao',
    icone: Settings2,
    paginas: [
      { titulo: 'Usuários', url: '/administracao/usuarios', icone: UserCog },
      { titulo: 'Grupos de acesso', url: '/administracao/grupos', icone: LockKeyhole },
      { titulo: 'Empresas', url: '/administracao/empresas', icone: Landmark },
      {
        titulo: 'Tabelas Comuns',
        url: '/administracao/tabelas-comuns',
        icone: Database,
        paginas: [
          { titulo: 'Cidades', url: '/administracao/tabelas-comuns/cidades', icone: MapPinned },
        ],
      },
    ],
  },
]

/**
 * Permissão exigida pela tela: a URL sem a barra inicial, com `.` no lugar de `/`
 * (`/parametros/receitas` → `parametros.receitas`). Tem que bater com `backend/config/acesso.php`.
 */
export function permissaoDaTela(url: string): string {
  return url.slice(1).replaceAll('/', '.')
}

/** O Início é de todos; as demais telas dependem das permissões do usuário na prefeitura. */
export function podeAcessar(url: string, permissoes: string[]): boolean {
  return url === '/' || permissoes.includes(permissaoDaTela(url))
}

/** Menu só com as telas permitidas. Submenus e módulos que ficam vazios somem. */
export function menuPermitido(permissoes: string[], itens: Pagina[] = menu): Pagina[] {
  return itens.flatMap((item) => {
    if (!item.paginas) return podeAcessar(item.url, permissoes) ? [item] : []
    const paginas = menuPermitido(permissoes, item.paginas)
    return paginas.length ? [{ ...item, paginas }] : []
  })
}

/** Telas que abrem uma página: itens sem submenu, em qualquer nível. */
function folhas(pagina: Pagina): Pagina[] {
  return pagina.paginas ? pagina.paginas.flatMap(folhas) : [pagina]
}

/** Todas as telas navegáveis do menu. */
export const telas: Pagina[] = menu.flatMap(folhas)

/**
 * Telas só do superadmin: Empresas e Tabelas Comuns (gravam no banco central, que vale para todas
 * as prefeituras). Nenhum grupo as recebe. Tem que bater com `superadmin` em `config/acesso.php`.
 */
export function exclusivaDoSuperadmin(url: string): boolean {
  const permissao = permissaoDaTela(url)
  return (
    permissao === 'administracao.empresas' || permissao.startsWith('administracao.tabelas-comuns.')
  )
}

/**
 * Telas de cada módulo, para montar grupos de acesso. Início (sem permissão) e as telas exclusivas
 * do superadmin ficam de fora.
 */
export function telasPorModulo(): { modulo: Pagina; telas: Pagina[] }[] {
  return menu
    .filter((modulo) => modulo.paginas)
    .map((modulo) => ({
      modulo,
      telas: folhas(modulo).filter((tela) => !exclusivaDoSuperadmin(tela.url)),
    }))
    .filter(({ telas }) => telas.length > 0)
}

/** Primeira tela navegável de um item (ele mesmo, se não tiver submenu). */
export function primeiraTela(pagina: Pagina): Pagina {
  return folhas(pagina)[0]
}

/** Caminho do módulo até a tela aberta (ex.: Administração › Tabelas Comuns › Cidades). */
export function localizar(pathname: string, itens: Pagina[] = menu): Pagina[] {
  for (const item of itens) {
    if (item.url === pathname) return [item]
    const resto = item.paginas ? localizar(pathname, item.paginas) : []
    if (resto.length) return [item, ...resto]
  }
  return []
}

/** Módulo ou submenu que contém a tela aberta. */
export function ativo(item: Pagina, pathname: string): boolean {
  if (item.url === '/') return pathname === '/'
  return pathname === item.url || pathname.startsWith(`${item.url}/`)
}
