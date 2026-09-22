import {
  FileText,
  LayoutDashboard,
  Receipt,
  Settings2,
  SlidersHorizontal,
  Table2,
  type LucideIcon,
} from 'lucide-react'

/** Tela do menu. Com `paginas`, vira um submenu (que pode ter outros submenus dentro). */
export type Pagina = { titulo: string; url: string; paginas?: Pagina[] }

export type Modulo = Pagina & { icone: LucideIcon }

export const menu: Modulo[] = [
  { titulo: 'Início', url: '/', icone: LayoutDashboard },
  {
    titulo: 'Parâmetros',
    url: '/parametros',
    icone: SlidersHorizontal,
    paginas: [
      { titulo: 'Empresa', url: '/parametros/empresa' },
      { titulo: 'Receitas', url: '/parametros/receitas' },
      { titulo: 'Nota Fiscal', url: '/parametros/nota-fiscal' },
      { titulo: 'Alvará', url: '/parametros/alvara' },
      { titulo: 'ITBI', url: '/parametros/itbi' },
      { titulo: 'IPTU', url: '/parametros/iptu' },
      { titulo: 'Habite-se', url: '/parametros/habite-se' },
      { titulo: 'Certidão Negativa', url: '/parametros/certidao-negativa' },
      { titulo: 'Juros e Multa', url: '/parametros/juros-e-multa' },
      { titulo: 'Base Legal', url: '/parametros/base-legal' },
    ],
  },
  {
    titulo: 'Tabelas',
    url: '/tabelas',
    icone: Table2,
    paginas: [
      { titulo: 'Receitas Tributárias', url: '/tabelas/receitas-tributarias' },
      { titulo: 'Convênios', url: '/tabelas/convenios' },
      { titulo: 'Serviços', url: '/tabelas/servicos' },
      { titulo: 'IRPJ', url: '/tabelas/irpj' },
      { titulo: 'IRPF', url: '/tabelas/irpf' },
      { titulo: 'UFM', url: '/tabelas/ufm' },
      { titulo: 'INSS', url: '/tabelas/inss' },
      { titulo: 'Cadastro Econômico (Contribuintes)', url: '/tabelas/cadastro-economico' },
      {
        titulo: 'Tomadores de Serviço',
        url: '/tabelas/tomadores',
        paginas: [
          { titulo: 'Tomador', url: '/tabelas/tomadores/tomador' },
          { titulo: 'Tomador estrangeiro', url: '/tabelas/tomadores/estrangeiro' },
        ],
      },
      { titulo: 'Tipo de Alvará', url: '/tabelas/tipos-de-alvara' },
      { titulo: 'Natureza ITBI', url: '/tabelas/natureza-itbi' },
      { titulo: 'Fatores de Localização', url: '/tabelas/fatores-de-localizacao' },
      { titulo: 'Cadastro de Isenções', url: '/tabelas/isencoes' },
      { titulo: 'Cartório', url: '/tabelas/cartorios' },
      { titulo: 'Modelos de Certidão Negativa', url: '/tabelas/modelos-certidao-negativa' },
      { titulo: 'Modelos Histórico Nota Fiscal', url: '/tabelas/modelos-historico-nota-fiscal' },
      {
        titulo: 'Tabelas internas',
        url: '/tabelas/internas',
        paginas: [
          { titulo: 'Cidades', url: '/tabelas/internas/cidades' },
          { titulo: 'Bancos', url: '/tabelas/internas/bancos' },
          { titulo: 'CNAE', url: '/tabelas/internas/cnae' },
          {
            titulo: 'Lista de Serviços - Lei Compl. 116/2003',
            url: '/tabelas/internas/lista-de-servicos',
          },
          { titulo: 'SELIC', url: '/tabelas/internas/selic' },
          { titulo: 'Segmentos', url: '/tabelas/internas/segmentos' },
          { titulo: 'Numeração de Notas', url: '/tabelas/internas/numeracao-de-notas' },
          { titulo: 'Tipos de DAM', url: '/tabelas/internas/tipos-de-dam' },
        ],
      },
    ],
  },
  {
    titulo: 'Lançamentos',
    url: '/lancamentos',
    icone: Receipt,
    paginas: [
      { titulo: 'Documentos Avulsos', url: '/lancamentos/documentos-avulsos' },
      { titulo: 'Nota Fiscal', url: '/lancamentos/nota-fiscal' },
      { titulo: 'Alvará', url: '/lancamentos/alvara' },
      {
        titulo: 'Imóveis',
        url: '/lancamentos/imoveis',
        paginas: [
          { titulo: 'Imóveis Urbanos', url: '/lancamentos/imoveis/urbanos' },
          { titulo: 'Imóveis', url: '/lancamentos/imoveis/imoveis' },
          { titulo: 'Imóveis Rurais', url: '/lancamentos/imoveis/rurais' },
        ],
      },
      { titulo: 'ITBI', url: '/lancamentos/itbi' },
      { titulo: 'Habite-se', url: '/lancamentos/habite-se' },
      { titulo: 'IPTU', url: '/lancamentos/iptu' },
      {
        titulo: 'DAM',
        url: '/lancamentos/dam',
        paginas: [
          { titulo: 'Consultas DAMs', url: '/lancamentos/dam/consultas' },
          { titulo: 'DAMs de IPTU', url: '/lancamentos/dam/iptu' },
          { titulo: 'Arquivo Retorno', url: '/lancamentos/dam/arquivo-retorno' },
        ],
      },
      { titulo: 'Certidão Negativa', url: '/lancamentos/certidao-negativa' },
    ],
  },
  {
    titulo: 'Relatórios',
    url: '/relatorios',
    icone: FileText,
    paginas: [
      { titulo: 'Relatório de Rendimentos', url: '/relatorios/rendimentos' },
      { titulo: 'Receitas Apuradas', url: '/relatorios/receitas-apuradas' },
      { titulo: 'Relação do ISS', url: '/relatorios/iss' },
      { titulo: 'Relação do INSS', url: '/relatorios/inss' },
      { titulo: 'Relação do IRPF', url: '/relatorios/irpf' },
      {
        titulo: 'Notas Fiscais',
        url: '/relatorios/notas-fiscais',
        paginas: [
          { titulo: 'NFs Emitidas', url: '/relatorios/notas-fiscais/emitidas' },
          { titulo: 'NFs Emitidas p/ Serviço', url: '/relatorios/notas-fiscais/por-servico' },
          { titulo: 'NFs Emitidas p/ Prestador', url: '/relatorios/notas-fiscais/por-prestador' },
          { titulo: 'NFs Emitidas p/ Tomador', url: '/relatorios/notas-fiscais/por-tomador' },
          { titulo: 'NFs Emitidas p/ Valor', url: '/relatorios/notas-fiscais/por-valor' },
          { titulo: 'NFs Canceladas', url: '/relatorios/notas-fiscais/canceladas' },
        ],
      },
      {
        titulo: 'Alvarás',
        url: '/relatorios/alvaras',
        paginas: [
          { titulo: 'Listagem de Alvarás', url: '/relatorios/alvaras/listagem' },
          {
            titulo: 'Listagem de CNPJ que não Emitiram Alvarás',
            url: '/relatorios/alvaras/cnpj-sem-alvara',
          },
        ],
      },
      { titulo: 'Imóveis', url: '/relatorios/imoveis' },
      { titulo: 'ITBI', url: '/relatorios/itbi' },
      { titulo: 'Habite-se', url: '/relatorios/habite-se' },
      { titulo: 'DAMs', url: '/relatorios/dams' },
      {
        titulo: 'Contribuintes',
        url: '/relatorios/contribuintes',
        paginas: [
          { titulo: 'Relação de Lançamentos', url: '/relatorios/contribuintes/lancamentos' },
          { titulo: 'Relação de Contribuintes', url: '/relatorios/contribuintes/relacao' },
          { titulo: 'Cadastro Econômico', url: '/relatorios/contribuintes/cadastro-economico' },
          {
            titulo: 'Inscrição Municipal',
            url: '/relatorios/contribuintes/inscricao-municipal',
          },
        ],
      },
    ],
  },
  {
    titulo: 'Administração',
    url: '/administracao',
    icone: Settings2,
    paginas: [
      { titulo: 'Usuários', url: '/administracao/usuarios' },
      { titulo: 'Papéis e permissões', url: '/administracao/papeis' },
    ],
  },
]

/** Telas que abrem uma página: itens sem submenu, em qualquer nível. */
function folhas(pagina: Pagina): Pagina[] {
  return pagina.paginas ? pagina.paginas.flatMap(folhas) : [pagina]
}

/** Todas as telas navegáveis do menu. */
export const telas: Pagina[] = menu.flatMap(folhas)

/** Primeira tela navegável de um item (ele mesmo, se não tiver submenu). */
export function primeiraTela(pagina: Pagina): Pagina {
  return folhas(pagina)[0]
}

/** Caminho do módulo até a tela aberta (ex.: Tabelas › Tabelas internas › Cidades). */
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
