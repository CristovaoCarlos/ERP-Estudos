import {
  ArrowLeftRight,
  BadgeCheck,
  BadgePercent,
  BadgeX,
  Banknote,
  Briefcase,
  Building,
  Building2,
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
} from 'lucide-react'

/** Tela do menu. Com `paginas`, vira um submenu (que pode ter outros submenus dentro). */
export type Pagina = { titulo: string; url: string; icone: LucideIcon; paginas?: Pagina[] }

/** Item do primeiro nível do menu. */
export type Modulo = Pagina

export const menu: Modulo[] = [
  { titulo: 'Início', url: '/', icone: House },
  {
    titulo: 'Tabelas',
    url: '/tabelas',
    icone: Table2,
    paginas: [
      { titulo: 'Receitas Tributárias', url: '/tabelas/receitas-tributarias', icone: Coins },
      { titulo: 'Convênios', url: '/tabelas/convenios', icone: Handshake },
      { titulo: 'Serviços', url: '/tabelas/servicos', icone: Wrench },
      { titulo: 'IRPJ', url: '/tabelas/irpj', icone: Briefcase },
      { titulo: 'IRPF', url: '/tabelas/irpf', icone: User },
      { titulo: 'UFM', url: '/tabelas/ufm', icone: Calculator },
      { titulo: 'INSS', url: '/tabelas/inss', icone: ShieldCheck },
      {
        titulo: 'Cadastro Econômico (Contribuintes)',
        url: '/tabelas/cadastro-economico',
        icone: Users,
      },
      {
        titulo: 'Tomadores de Serviço',
        url: '/tabelas/tomadores',
        icone: UserCheck,
        paginas: [
          { titulo: 'Tomador', url: '/tabelas/tomadores/tomador', icone: UserRound },
          { titulo: 'Tomador estrangeiro', url: '/tabelas/tomadores/estrangeiro', icone: Globe },
        ],
      },
      { titulo: 'Tipo de Alvará', url: '/tabelas/tipos-de-alvara', icone: Tags },
      { titulo: 'Natureza ITBI', url: '/tabelas/natureza-itbi', icone: ArrowLeftRight },
      { titulo: 'Fatores de Localização', url: '/tabelas/fatores-de-localizacao', icone: MapPin },
      { titulo: 'Cadastro de Isenções', url: '/tabelas/isencoes', icone: BadgePercent },
      { titulo: 'Cartório', url: '/tabelas/cartorios', icone: Stamp },
      {
        titulo: 'Modelos de Certidão Negativa',
        url: '/tabelas/modelos-certidao-negativa',
        icone: FileCheck,
      },
      {
        titulo: 'Modelos Histórico Nota Fiscal',
        url: '/tabelas/modelos-historico-nota-fiscal',
        icone: History,
      },
    ],
  },
  {
    titulo: 'Lançamentos',
    url: '/lancamentos',
    icone: Receipt,
    paginas: [
      { titulo: 'Documentos Avulsos', url: '/lancamentos/documentos-avulsos', icone: FilePlus },
      { titulo: 'Nota Fiscal', url: '/lancamentos/nota-fiscal', icone: ReceiptText },
      { titulo: 'Alvará', url: '/lancamentos/alvara', icone: BadgeCheck },
      {
        titulo: 'Imóveis',
        url: '/lancamentos/imoveis',
        icone: Building,
        paginas: [
          { titulo: 'Imóveis Urbanos', url: '/lancamentos/imoveis/urbanos', icone: Building2 },
          { titulo: 'Imóveis', url: '/lancamentos/imoveis/imoveis', icone: House },
          { titulo: 'Imóveis Rurais', url: '/lancamentos/imoveis/rurais', icone: Tractor },
        ],
      },
      { titulo: 'ITBI', url: '/lancamentos/itbi', icone: ArrowLeftRight },
      { titulo: 'Habite-se', url: '/lancamentos/habite-se', icone: KeyRound },
      { titulo: 'IPTU', url: '/lancamentos/iptu', icone: House },
      {
        titulo: 'DAM',
        url: '/lancamentos/dam',
        icone: Banknote,
        paginas: [
          { titulo: 'Consultas DAMs', url: '/lancamentos/dam/consultas', icone: Search },
          { titulo: 'DAMs de IPTU', url: '/lancamentos/dam/iptu', icone: Receipt },
          { titulo: 'Arquivo Retorno', url: '/lancamentos/dam/arquivo-retorno', icone: FileInput },
        ],
      },
      { titulo: 'Certidão Negativa', url: '/lancamentos/certidao-negativa', icone: FileCheck },
    ],
  },
  {
    titulo: 'Relatórios',
    url: '/relatorios',
    icone: FileText,
    paginas: [
      { titulo: 'Relatório de Rendimentos', url: '/relatorios/rendimentos', icone: TrendingUp },
      { titulo: 'Receitas Apuradas', url: '/relatorios/receitas-apuradas', icone: ChartColumn },
      { titulo: 'Relação do ISS', url: '/relatorios/iss', icone: ClipboardList },
      { titulo: 'Relação do INSS', url: '/relatorios/inss', icone: ShieldCheck },
      { titulo: 'Relação do IRPF', url: '/relatorios/irpf', icone: User },
      {
        titulo: 'Notas Fiscais',
        url: '/relatorios/notas-fiscais',
        icone: ReceiptText,
        paginas: [
          { titulo: 'NFs Emitidas', url: '/relatorios/notas-fiscais/emitidas', icone: FileOutput },
          {
            titulo: 'NFs Emitidas p/ Serviço',
            url: '/relatorios/notas-fiscais/por-servico',
            icone: Wrench,
          },
          {
            titulo: 'NFs Emitidas p/ Prestador',
            url: '/relatorios/notas-fiscais/por-prestador',
            icone: Store,
          },
          {
            titulo: 'NFs Emitidas p/ Tomador',
            url: '/relatorios/notas-fiscais/por-tomador',
            icone: UserRound,
          },
          {
            titulo: 'NFs Emitidas p/ Valor',
            url: '/relatorios/notas-fiscais/por-valor',
            icone: CircleDollarSign,
          },
          { titulo: 'NFs Canceladas', url: '/relatorios/notas-fiscais/canceladas', icone: FileX },
        ],
      },
      {
        titulo: 'Alvarás',
        url: '/relatorios/alvaras',
        icone: BadgeCheck,
        paginas: [
          { titulo: 'Listagem de Alvarás', url: '/relatorios/alvaras/listagem', icone: List },
          {
            titulo: 'Listagem de CNPJ que não Emitiram Alvarás',
            url: '/relatorios/alvaras/cnpj-sem-alvara',
            icone: BadgeX,
          },
        ],
      },
      { titulo: 'Imóveis', url: '/relatorios/imoveis', icone: House },
      { titulo: 'ITBI', url: '/relatorios/itbi', icone: ArrowLeftRight },
      { titulo: 'Habite-se', url: '/relatorios/habite-se', icone: KeyRound },
      { titulo: 'DAMs', url: '/relatorios/dams', icone: Banknote },
      {
        titulo: 'Contribuintes',
        url: '/relatorios/contribuintes',
        icone: Users,
        paginas: [
          {
            titulo: 'Relação de Lançamentos',
            url: '/relatorios/contribuintes/lancamentos',
            icone: ListOrdered,
          },
          {
            titulo: 'Relação de Contribuintes',
            url: '/relatorios/contribuintes/relacao',
            icone: Contact,
          },
          {
            titulo: 'Cadastro Econômico',
            url: '/relatorios/contribuintes/cadastro-economico',
            icone: Briefcase,
          },
          {
            titulo: 'Inscrição Municipal',
            url: '/relatorios/contribuintes/inscricao-municipal',
            icone: IdCard,
          },
        ],
      },
    ],
  },
  {
    titulo: 'Parâmetros da Empresa',
    url: '/parametros',
    icone: SlidersHorizontal,
    paginas: [
      { titulo: 'Receitas', url: '/parametros/receitas', icone: HandCoins },
      { titulo: 'Nota Fiscal', url: '/parametros/nota-fiscal', icone: ReceiptText },
      { titulo: 'Alvará', url: '/parametros/alvara', icone: BadgeCheck },
      { titulo: 'ITBI', url: '/parametros/itbi', icone: ArrowLeftRight },
      { titulo: 'IPTU', url: '/parametros/iptu', icone: House },
      { titulo: 'Habite-se', url: '/parametros/habite-se', icone: KeyRound },
      { titulo: 'Certidão Negativa', url: '/parametros/certidao-negativa', icone: FileCheck },
      { titulo: 'Juros e Multa', url: '/parametros/juros-e-multa', icone: Percent },
      { titulo: 'Base Legal', url: '/parametros/base-legal', icone: Scale },
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
          { titulo: 'Bancos', url: '/administracao/tabelas-comuns/bancos', icone: Landmark },
          { titulo: 'CNAE', url: '/administracao/tabelas-comuns/cnae', icone: ListTree },
          {
            titulo: 'Lista de Serviços - Lei Compl. 116/2003',
            url: '/administracao/tabelas-comuns/lista-de-servicos',
            icone: ListChecks,
          },
          { titulo: 'SELIC', url: '/administracao/tabelas-comuns/selic', icone: TrendingUp },
          { titulo: 'Segmentos', url: '/administracao/tabelas-comuns/segmentos', icone: Shapes },
          {
            titulo: 'Numeração de Notas',
            url: '/administracao/tabelas-comuns/numeracao-de-notas',
            icone: Hash,
          },
          {
            titulo: 'Tipos de DAM',
            url: '/administracao/tabelas-comuns/tipos-de-dam',
            icone: FileType,
          },
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
