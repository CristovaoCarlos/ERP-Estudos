import {
  FileText,
  Landmark,
  LayoutDashboard,
  Scale,
  Settings2,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type Pagina = { titulo: string; url: string }

export type Modulo = Pagina & { icone: LucideIcon; paginas?: Pagina[] }

export const menu: Modulo[] = [
  { titulo: 'Início', url: '/', icone: LayoutDashboard },
  {
    titulo: 'Cadastros',
    url: '/cadastros',
    icone: Users,
    paginas: [
      { titulo: 'Contribuintes', url: '/cadastros/contribuintes' },
      { titulo: 'Imóveis', url: '/cadastros/imoveis' },
      { titulo: 'Empresas', url: '/cadastros/empresas' },
    ],
  },
  {
    titulo: 'Tributos',
    url: '/tributos',
    icone: Landmark,
    paginas: [
      { titulo: 'IPTU', url: '/tributos/iptu' },
      { titulo: 'ISS', url: '/tributos/iss' },
      { titulo: 'Taxas', url: '/tributos/taxas' },
    ],
  },
  {
    titulo: 'Arrecadação',
    url: '/arrecadacao',
    icone: Wallet,
    paginas: [
      { titulo: 'Guias de pagamento', url: '/arrecadacao/guias' },
      { titulo: 'Pagamentos', url: '/arrecadacao/pagamentos' },
    ],
  },
  {
    titulo: 'Dívida ativa',
    url: '/divida-ativa',
    icone: Scale,
    paginas: [
      { titulo: 'Inscrições', url: '/divida-ativa/inscricoes' },
      { titulo: 'Certidões', url: '/divida-ativa/certidoes' },
    ],
  },
  { titulo: 'Relatórios', url: '/relatorios', icone: FileText },
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

/** Todas as telas navegáveis do menu (módulos sem submenu e páginas de submenu). */
export const telas: Pagina[] = menu.flatMap((modulo) => modulo.paginas ?? [modulo])

export function localizar(pathname: string): { modulo?: Modulo; pagina?: Pagina } {
  for (const modulo of menu) {
    if (modulo.url === pathname) return { modulo }
    const pagina = modulo.paginas?.find((p) => p.url === pathname)
    if (pagina) return { modulo, pagina }
  }
  return {}
}

export function moduloAtivo(modulo: Modulo, pathname: string): boolean {
  return modulo.url === '/' ? pathname === '/' : pathname.startsWith(modulo.url)
}
