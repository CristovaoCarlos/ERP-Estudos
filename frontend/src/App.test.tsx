import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { ThemeProvider } from 'next-themes'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { api, getToken, setToken } from '@/lib/api'
import { permissaoDaTela, telas } from '@/lib/navegacao'
import { subdominioDaPrefeitura } from '@/lib/prefeitura'
import Landing from '@/pages/Landing'

const usuario = {
  id: 1,
  name: 'Fiscal Teste',
  cpf: '52998224725',
  email: 'fiscal@stm.localhost',
  foto: null,
  // Superadmin: vê todas as telas, inclusive Administração › Empresas.
  superadmin: true,
  grupos: [] as string[],
  permissoes: telas.filter((tela) => tela.url !== '/').map((tela) => permissaoDaTela(tela.url)),
  prefeituras: [
    { id: 'lemarq', nome: 'Lemarq', dominio: 'lemarq.localhost' },
    { id: 'prefeitura_teste', nome: null, dominio: 'prefeitura-teste.localhost' },
  ],
}

/** Usuário comum, só com o grupo Parâmetros. */
const usuarioDeParametros = {
  ...usuario,
  superadmin: false,
  grupos: ['Parâmetros'],
  permissoes: telas
    .filter((tela) => tela.url.startsWith('/parametros/'))
    .map((tela) => permissaoDaTela(tela.url)),
}

function renderizar(ui: React.ReactNode, rota = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[rota]}>{ui}</MemoryRouter>
    </QueryClientProvider>,
  )
}

function erroHttp(status: number, data: unknown) {
  const headers = new AxiosHeaders()
  return new AxiosError('erro', String(status), { headers }, null, {
    status,
    data,
    statusText: '',
    headers,
    config: { headers },
  })
}

function mockGet(respostas: Record<string, unknown>) {
  return vi.spyOn(api, 'get').mockImplementation(async (url) => {
    const resposta = respostas[url]
    if (resposta instanceof Error) throw resposta
    return { data: resposta }
  })
}

// Abre menus Radix pelo teclado: no jsdom, o clique abre e fecha o menu em seguida quando
// outro teste já renderizou a tela de login antes (interação entre user-event e Radix).
async function abrirMenu(nome: string | RegExp) {
  const gatilho = await screen.findByRole('button', { name: nome })
  gatilho.focus()
  await userEvent.keyboard('{Enter}')
}

function sidebar() {
  return within(document.querySelector<HTMLElement>('[data-slot="sidebar"]')!)
}

afterEach(() => {
  vi.restoreAllMocks()
  setToken(null)
  localStorage.removeItem('stm.menu.largura')
})

describe('prefeitura pelo endereço', () => {
  it('identifica o subdomínio da prefeitura', () => {
    expect(window.location.hostname).toBe('lemarq.localhost')
    expect(subdominioDaPrefeitura()).toBe('lemarq')
    expect(subdominioDaPrefeitura('prefeitura-teste.localhost')).toBe('prefeitura-teste')
  })

  it('domínio central não é prefeitura', () => {
    expect(subdominioDaPrefeitura('localhost')).toBeNull()
    expect(subdominioDaPrefeitura('127.0.0.1')).toBeNull()
  })
})

describe('landing page', () => {
  it('aparece quando a prefeitura do endereço não existe', async () => {
    mockGet({ '/tenant': erroHttp(404, { message: 'Prefeitura não encontrada.' }) })
    renderizar(<App />, '/login')

    expect(await screen.findByText('Prefeitura não encontrada')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Toda a tributação do seu município',
    )
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument()
  })

  it('mostra erro de conexão quando o servidor falha', async () => {
    mockGet({ '/tenant': erroHttp(500, {}) })
    renderizar(<App />)

    expect(await screen.findByText('Não foi possível conectar ao servidor')).toBeInTheDocument()
  })

  it('não tem campo para escolher a prefeitura', () => {
    renderizar(<Landing />)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Toda a tributação do seu município',
    )
    expect(screen.queryByLabelText('Endereço da prefeitura')).not.toBeInTheDocument()
    expect(screen.queryByText('Acessar minha prefeitura')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument()
  })

  it('alterna entre o tema claro e o escuro pelo botão do cabeçalho', async () => {
    renderizar(
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <Landing />
      </ThemeProvider>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Mudar para o tema escuro' }))
    expect(document.documentElement).toHaveClass('dark')

    await userEvent.click(screen.getByRole('button', { name: 'Mudar para o tema claro' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(screen.queryByText('Sistema')).not.toBeInTheDocument()
  })
})

describe('login', () => {
  it('sem sessão, a raiz da prefeitura mostra a landing com o botão Painel', async () => {
    mockGet({ '/tenant': { id: 'lemarq' } })
    renderizar(<App />)

    const painel = await screen.findByRole('link', { name: 'Painel' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Toda a tributação do seu município',
    )

    await userEvent.click(painel)
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('redireciona para o login ao abrir uma tela sem sessão', async () => {
    mockGet({ '/tenant': { id: 'lemarq' } })
    renderizar(<App />, '/parametros/receitas')

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('valida os campos antes de enviar', async () => {
    mockGet({ '/tenant': { id: 'lemarq' } })
    const post = vi.spyOn(api, 'post')
    renderizar(<App />, '/login')

    await userEvent.click(await screen.findByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe um CPF válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('faz login, guarda o token e abre a página inicial', async () => {
    mockGet({ '/tenant': { id: 'lemarq' } })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { token: 'tok-123', usuario } })
    renderizar(<App />, '/login')

    const campoCpf = await screen.findByLabelText('CPF')
    await userEvent.type(campoCpf, '52998224725')
    expect(campoCpf).toHaveValue('529.982.247-25')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Fiscal Teste')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/login', { cpf: '52998224725', password: 'segredo' })
    expect(getToken()).toBe('tok-123')
    expect(screen.getByRole('heading', { name: 'Olá, Fiscal' })).toBeInTheDocument()
  })

  it('mostra a mensagem do servidor quando as credenciais são inválidas', async () => {
    mockGet({ '/tenant': { id: 'lemarq' } })
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { cpf: ['CPF ou senha inválidos.'] } }),
    )
    renderizar(<App />, '/login')

    await userEvent.type(await screen.findByLabelText('CPF'), '529.982.247-25')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('CPF ou senha inválidos.')
    expect(getToken()).toBeNull()
  })

  it('sair revoga a sessão e volta para o login', async () => {
    setToken('tok-123')
    mockGet({ '/tenant': { id: 'lemarq' }, '/me': usuario })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: null })
    renderizar(<App />)

    await abrirMenu('Menu do usuário')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/logout')
    expect(getToken()).toBeNull()
  })
})

describe('sistema', () => {
  function entrarLogado(rota = '/') {
    setToken('tok-123')
    mockGet({ '/tenant': { id: 'lemarq' }, '/me': usuario })
    renderizar(<App />, rota)
  }

  it('mostra os módulos no menu lateral', async () => {
    entrarLogado()

    for (const modulo of [
      'Tabelas',
      'Lançamentos',
      'Relatórios',
      'Parâmetros da Empresa',
      'Administração',
    ]) {
      expect(await screen.findByRole('button', { name: modulo })).toBeInTheDocument()
    }
    for (const removido of ['Cadastros', 'Tributos', 'Arrecadação', 'Dívida ativa']) {
      expect(screen.queryByRole('button', { name: removido })).not.toBeInTheDocument()
    }
    expect(sidebar().getByRole('link', { name: 'Início' })).toHaveAttribute('data-active', 'true')
  })

  it('abre uma tela do menu com breadcrumb', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Tabelas' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Convênios' }))

    expect(await screen.findByText('Esta tela ainda está em construção.')).toBeInTheDocument()
    const trilha = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(trilha).toHaveTextContent('Tabelas')
    expect(trilha).toHaveTextContent('Convênios')
  })

  it('lista as telas de Parâmetros no submenu', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Parâmetros da Empresa' }))

    expect(await screen.findByRole('link', { name: 'Receitas' })).toHaveAttribute(
      'href',
      '/parametros/receitas',
    )
    expect(screen.queryByRole('link', { name: 'Empresa' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Juros e Multa' })).toHaveAttribute(
      'href',
      '/parametros/juros-e-multa',
    )
    expect(screen.getByRole('link', { name: 'Base Legal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Receitas' }).querySelector('svg')).not.toBeNull()
  })

  it('abre uma tela de submenu aninhado em Tabelas', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Tabelas' }))
    expect(await screen.findByRole('link', { name: 'Receitas Tributárias' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tomadores de Serviço' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Tomador estrangeiro' }))

    expect(await screen.findByText('Esta tela ainda está em construção.')).toBeInTheDocument()
    const trilha = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(trilha).toHaveTextContent('Tabelas')
    expect(trilha).toHaveTextContent('Tomadores de Serviço')
    expect(trilha).toHaveTextContent('Tomador estrangeiro')
  })

  it('Tabelas Comuns fica em Administração, abaixo de Empresas', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Administração' }))
    await screen.findByRole('link', { name: 'Usuários' })
    const itens = within(screen.getByRole('link', { name: 'Usuários' }).closest('ul')!)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(itens.indexOf('Tabelas Comuns')).toBe(itens.indexOf('Empresas') + 1)

    await userEvent.click(screen.getByRole('button', { name: 'Tabelas Comuns' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Tipos de DAM' }))

    expect(await screen.findByRole('heading', { name: 'Tipos de DAM' })).toBeInTheDocument()
    const trilha = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(trilha).toHaveTextContent('Administração')
    expect(trilha).toHaveTextContent('Tabelas Comuns')
    expect(trilha).toHaveTextContent('Tipos de DAM')
    expect(within(trilha).getByRole('link', { name: 'Tabelas Comuns' })).toHaveAttribute(
      'href',
      // O submenu leva à primeira tela dele.
      '/administracao/tabelas-comuns/cidades',
    )
  })

  it('lista as telas de Lançamentos com os submenus Imóveis e DAM', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Lançamentos' }))
    expect(await screen.findByRole('link', { name: 'Documentos Avulsos' })).toHaveAttribute(
      'href',
      '/lancamentos/documentos-avulsos',
    )
    await userEvent.click(screen.getByRole('button', { name: 'DAM' }))

    expect(await screen.findByRole('link', { name: 'Arquivo Retorno' })).toHaveAttribute(
      'href',
      '/lancamentos/dam/arquivo-retorno',
    )
    expect(screen.getByRole('button', { name: 'Imóveis' })).toBeInTheDocument()
  })

  it('lista as telas de Relatórios com o submenu Notas Fiscais', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Relatórios' }))
    expect(await screen.findByRole('link', { name: 'Receitas Apuradas' })).toHaveAttribute(
      'href',
      '/relatorios/receitas-apuradas',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Notas Fiscais' }))

    expect(await screen.findByRole('link', { name: 'NFs Canceladas' })).toHaveAttribute(
      'href',
      '/relatorios/notas-fiscais/canceladas',
    )
    for (const submenu of ['Alvarás', 'Contribuintes']) {
      expect(screen.getByRole('button', { name: submenu })).toBeInTheDocument()
    }
  })

  it('ajusta a largura do menu pela borda e lembra a escolha', async () => {
    entrarLogado()

    const alca = await screen.findByRole('separator', { name: 'Largura do menu' })
    const wrapper = document.querySelector<HTMLElement>('[data-slot="sidebar-wrapper"]')!
    expect(wrapper.style.getPropertyValue('--sidebar-width')).toBe('256px')

    alca.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')

    expect(wrapper.style.getPropertyValue('--sidebar-width')).toBe('288px')
    expect(alca).toHaveAttribute('aria-valuenow', '288')
    expect(localStorage.getItem('stm.menu.largura')).toBe('288')
  })

  it('mostra o seletor de tema no topo, fora do menu do usuário', async () => {
    entrarLogado()

    expect(
      await screen.findByRole('button', { name: 'Mudar para o tema escuro' }),
    ).toBeInTheDocument()

    await abrirMenu('Menu do usuário')
    expect(await screen.findByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Tema/ })).not.toBeInTheDocument()
  })

  it('lista as prefeituras do usuário no seletor', async () => {
    entrarLogado()

    await abrirMenu(/Lemarq/)

    expect(await screen.findByRole('menuitem', { name: /Prefeitura Teste/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Lemarq/ })).toBeInTheDocument()
  })
})

describe('grupos de acesso', () => {
  function entrarComo(me: typeof usuario, rota = '/') {
    setToken('tok-123')
    mockGet({ '/tenant': { id: 'lemarq', nome: 'Lemarq' }, '/me': me })
    renderizar(<App />, rota)
  }

  it('o menu mostra só os módulos dos grupos do usuário', async () => {
    entrarComo(usuarioDeParametros)

    expect(await screen.findByRole('button', { name: 'Parâmetros da Empresa' })).toBeInTheDocument()
    for (const modulo of ['Tabelas', 'Lançamentos', 'Relatórios', 'Administração']) {
      expect(sidebar().queryByRole('button', { name: modulo })).not.toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: /^Parâmetros da Empresa/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Tabelas/ })).not.toBeInTheDocument()
  })

  it('tela sem permissão mostra "Sem acesso"', async () => {
    entrarComo(usuarioDeParametros, '/tabelas/ufm')

    expect(await screen.findByText('Sem acesso')).toBeInTheDocument()
    expect(screen.queryByText('Esta tela ainda está em construção.')).not.toBeInTheDocument()
  })

  it('só o superadmin vê Empresas e Tabelas Comuns', async () => {
    entrarComo({ ...usuario, superadmin: false, permissoes: ['administracao.usuarios'] })

    await userEvent.click(await screen.findByRole('button', { name: 'Administração' }))

    expect(await screen.findByRole('link', { name: 'Usuários' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Empresas' })).not.toBeInTheDocument()
    expect(sidebar().queryByRole('button', { name: 'Tabelas Comuns' })).not.toBeInTheDocument()
  })
})

describe('empresas', () => {
  const empresas = [
    {
      id: 'lemarq',
      nome: 'Lemarq',
      cnpj: null,
      dominio: 'lemarq.localhost',
      situacao: 'ativa',
      criada_em: '2026-09-22T12:00:00+00:00',
    },
    {
      id: 'nova_esperanca',
      nome: 'Prefeitura de Nova Esperança',
      cnpj: '11222333000181',
      dominio: 'nova-esperanca.localhost',
      situacao: 'provisionando',
      criada_em: '2026-09-22T15:00:00+00:00',
    },
  ]

  function abrirEmpresas() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/empresas': { data: empresas },
    })
    renderizar(<App />, '/administracao/empresas')
  }

  async function preencher(nome: string, cnpj: string, subdominio: string) {
    await userEvent.click(await screen.findByRole('button', { name: 'Nova empresa' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), nome)
    await userEvent.type(within(dialogo).getByLabelText('CNPJ'), cnpj)
    await userEvent.type(within(dialogo).getByLabelText('Endereço'), subdominio)
    await userEvent.type(within(dialogo).getByLabelText('CPF'), '52998224725')
    await userEvent.type(within(dialogo).getByLabelText('E-mail'), 'admin@exemplo.gov.br')
    await userEvent.type(within(dialogo).getByLabelText('Senha inicial'), 'senha-do-admin')
    return dialogo
  }

  it('lista as empresas com CNPJ, endereço e situação', async () => {
    abrirEmpresas()

    const linha = (await screen.findByText('Prefeitura de Nova Esperança')).closest('tr')!
    expect(linha).toHaveTextContent('11.222.333/0001-81')
    expect(linha).toHaveTextContent('nova-esperanca.localhost')
    expect(linha).toHaveTextContent('Provisionando')
    expect(within(screen.getByRole('table')).getByText('Lemarq').closest('tr')).toHaveTextContent(
      'Ativa',
    )
  })

  it('cadastra uma empresa com o CNPJ sem máscara', async () => {
    abrirEmpresas()
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: empresas[1] })

    const dialogo = await preencher(
      'Prefeitura de Nova Esperança',
      '11222333000181',
      'nova-esperanca',
    )
    expect(within(dialogo).getByLabelText('CNPJ')).toHaveValue('11.222.333/0001-81')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/empresas', {
      nome: 'Prefeitura de Nova Esperança',
      cnpj: '11222333000181',
      subdominio: 'nova-esperanca',
      administrador: {
        cpf: '52998224725',
        email: 'admin@exemplo.gov.br',
        senha: 'senha-do-admin',
      },
    })
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('valida os campos antes de enviar', async () => {
    abrirEmpresas()
    const post = vi.spyOn(api, 'post')

    const dialogo = await preencher('Nova', '11222333000182', 'Nova Cidade')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(await within(dialogo).findByText('Informe um CNPJ válido.')).toBeInTheDocument()
    expect(
      within(dialogo).getByText('Use apenas letras minúsculas, números e hífen.'),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('mostra no campo o erro devolvido pelo servidor', async () => {
    abrirEmpresas()
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { subdominio: ['Este endereço já está em uso.'] } }),
    )

    const dialogo = await preencher('Lemarq 2', '11222333000181', 'lemarq')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(await within(dialogo).findByText('Este endereço já está em uso.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

const gruposMock = [
  { id: 1, nome: 'Lançamentos', telas: ['lancamentos.iptu'], usuarios: 0, sistema: false },
  { id: 2, nome: 'Parâmetros', telas: ['parametros.receitas'], usuarios: 1, sistema: false },
  { id: 3, nome: 'Tabelas', telas: ['tabelas.ufm', 'tabelas.inss'], usuarios: 2, sistema: false },
  { id: 4, nome: 'Administrador', telas: ['tabelas.ufm'], usuarios: 1, sistema: true },
]

describe('usuarios', () => {
  const usuarios = [
    {
      id: 1,
      name: 'Fiscal Teste',
      cpf: '52998224725',
      email: 'fiscal@stm.localhost',
      foto: null,
      superadmin: true,
      ativo: true,
      grupos: [],
      somente_grupos: false,
    },
    {
      id: 2,
      name: 'Maria Souza',
      cpf: '11144477735',
      email: 'maria@exemplo.com',
      foto: null,
      superadmin: false,
      ativo: true,
      grupos: ['Tabelas'],
      somente_grupos: false,
    },
  ]

  function abrirUsuarios() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/usuarios': { data: usuarios },
      '/grupos': { data: gruposMock },
    })
    renderizar(<App />, '/administracao/usuarios')
  }

  it('lista os usuários com CPF e grupos', async () => {
    abrirUsuarios()

    const linha = (await screen.findByText('Maria Souza')).closest('tr')!
    expect(linha).toHaveTextContent('111.444.777-35')
    expect(linha).toHaveTextContent('maria@exemplo.com')
    expect(linha).toHaveTextContent('Tabelas')
    expect(
      within(screen.getByRole('table')).getByText('Fiscal Teste').closest('tr'),
    ).toHaveTextContent('Superadmin')
  })

  it('a busca rápida filtra as linhas da listagem', async () => {
    abrirUsuarios()

    expect(await screen.findByRole('cell', { name: /Maria Souza/ })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Busca rápida'), 'maria')

    expect(screen.getByRole('cell', { name: /Maria Souza/ })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: /Fiscal Teste/ })).not.toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Busca rápida'))
    await userEvent.type(screen.getByLabelText('Busca rápida'), 'ninguém')

    expect(await screen.findByText('Nada encontrado')).toBeInTheDocument()
  })

  it('esconde uma coluna pelo menu Colunas e lembra a escolha', async () => {
    abrirUsuarios()

    expect(await screen.findByRole('columnheader', { name: 'CPF' })).toBeInTheDocument()

    await abrirMenu('Colunas')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'CPF' }))

    expect(screen.queryByRole('columnheader', { name: 'CPF' })).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('stm.colunas.usuarios')!)).toEqual(['cpf'])
    // Ações não pode ser escondida.
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Ações' })).not.toBeInTheDocument()
  })

  it('filtra por situação pelo menu Filtros', async () => {
    abrirUsuarios()
    expect(await screen.findByRole('cell', { name: /Maria Souza/ })).toBeInTheDocument()

    await abrirMenu('Filtros')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Inativos' }))

    expect(screen.queryByRole('cell', { name: /Maria Souza/ })).not.toBeInTheDocument()
    expect(await screen.findByText('Nenhum usuário')).toBeInTheDocument()
  })

  it('pagina a listagem pelo rodapé', async () => {
    const muitos = Array.from({ length: 17 }, (_, i) => ({
      ...usuarios[1],
      id: i + 10,
      name: `Servidor ${String(i + 1).padStart(2, '0')}`,
    }))
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/usuarios': { data: muitos },
      '/grupos': { data: gruposMock },
    })
    renderizar(<App />, '/administracao/usuarios')

    expect(await screen.findByText('17 registros')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(16) // cabeçalho + 15
    expect(screen.getByRole('button', { name: 'Página anterior' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Próxima página' }))

    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument()
    expect(screen.getByRole('cell', { name: /Servidor 17/ })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: /Servidor 01/ })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Próxima página' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Primeira página' }))
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument()
  })

  it('a busca volta para a primeira página e o total acompanha', async () => {
    abrirUsuarios()

    expect(await screen.findByText('2 registros')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Busca rápida'), 'maria')

    expect(await screen.findByText('1 registro')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
  })

  it('não deixa remover o próprio acesso', async () => {
    abrirUsuarios()

    expect(await screen.findByRole('button', { name: 'Remover Fiscal Teste' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remover Maria Souza' })).toBeEnabled()
  })

  it('cadastra um usuário com grupo, enviando o CPF sem máscara', async () => {
    abrirUsuarios()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { ...usuarios[1], vinculado: false },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Novo usuário' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Maria Souza')
    await userEvent.type(within(dialogo).getByLabelText('CPF'), '52998224725')
    await userEvent.type(within(dialogo).getByLabelText('E-mail'), 'maria@exemplo.com')
    await userEvent.type(within(dialogo).getByLabelText('Senha'), 'segredo-forte')
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: 'Tabelas' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/usuarios', {
      name: 'Maria Souza',
      email: 'maria@exemplo.com',
      password: 'segredo-forte',
      cpf: '52998224725',
      grupos: ['Tabelas'],
    })
  })

  it('na alteração não pede CPF nem grupos, e a senha é opcional', async () => {
    abrirUsuarios()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: usuarios[1] })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar Maria Souza' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).queryByLabelText('CPF')).not.toBeInTheDocument()
    expect(within(dialogo).queryByRole('checkbox')).not.toBeInTheDocument()
    await userEvent.type(within(dialogo).getByLabelText('Nome'), ' Lima')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(put).toHaveBeenCalledWith('/usuarios/2', {
      name: 'Maria Souza Lima',
      email: 'maria@exemplo.com',
    })
  })

  it('edita os vínculos do usuário em um diálogo próprio', async () => {
    abrirUsuarios()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: usuarios[1] })

    await userEvent.click(
      await screen.findByRole('button', { name: 'Editar vínculos de Maria Souza' }),
    )
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByRole('checkbox', { name: /Tabelas/ })).toBeChecked()

    await userEvent.click(within(dialogo).getByRole('checkbox', { name: /Parâmetros/ }))
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: /Tabelas/ }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(put).toHaveBeenCalledWith('/usuarios/2/vinculos', { grupos: ['Parâmetros'] })
  })

  it('desativa o acesso depois de confirmar e reativa direto', async () => {
    abrirUsuarios()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { ...usuarios[1], ativo: false } })

    await userEvent.click(await screen.findByRole('button', { name: 'Desativar Maria Souza' }))
    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('deixa de entrar nesta prefeitura')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Desativar acesso' }))

    expect(put).toHaveBeenCalledWith('/usuarios/2/status', { ativo: false })
  })

  it('mostra quem está inativo e ativa sem confirmação', async () => {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/usuarios': { data: [usuarios[0], { ...usuarios[1], ativo: false }] },
      '/grupos': { data: gruposMock },
    })
    renderizar(<App />, '/administracao/usuarios')
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: usuarios[1] })

    const linha = (await screen.findByText('Maria Souza')).closest('tr')!
    expect(linha).toHaveTextContent('Inativo')

    await userEvent.click(within(linha).getByRole('button', { name: 'Ativar Maria Souza' }))

    expect(put).toHaveBeenCalledWith('/usuarios/2/status', { ativo: true })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('não deixa desativar o próprio acesso', async () => {
    abrirUsuarios()

    expect(await screen.findByRole('button', { name: 'Desativar Fiscal Teste' })).toBeDisabled()
  })

  it('remove o acesso depois de confirmar', async () => {
    abrirUsuarios()
    const remover = vi.spyOn(api, 'delete').mockResolvedValue({ data: null })

    await userEvent.click(await screen.findByRole('button', { name: 'Remover Maria Souza' }))
    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('perde o acesso a esta prefeitura')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Remover acesso' }))

    expect(remover).toHaveBeenCalledWith('/usuarios/2')
  })
})

describe('grupos de acesso', () => {
  function abrirGrupos() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/grupos': { data: gruposMock },
    })
    renderizar(<App />, '/administracao/grupos')
  }

  it('lista os grupos com a quantidade de telas e de usuários', async () => {
    abrirGrupos()

    const linha = (await screen.findByRole('cell', { name: 'Tabelas' })).closest('tr')!
    // 2 telas e 2 usuários
    expect(within(linha).getAllByText('2')).toHaveLength(2)
    expect(screen.getByRole('cell', { name: 'Lançamentos' }).closest('tr')).toHaveTextContent('1')
  })

  it('cadastra um grupo com telas de módulos diferentes', async () => {
    abrirGrupos()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { id: 4, nome: 'Fiscalização', telas: ['parametros.alvara'], usuarios: 0 },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Novo grupo' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Fiscalização')
    // "Alvará" e "Habite-se" existem em vários módulos: escolhe as de Parâmetros.
    const parametros = within(within(dialogo).getByRole('group', { name: 'Parâmetros da Empresa' }))
    await userEvent.click(parametros.getByRole('checkbox', { name: 'Alvará' }))
    await userEvent.click(parametros.getByRole('checkbox', { name: 'Habite-se' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/grupos', {
      nome: 'Fiscalização',
      telas: ['parametros.alvara', 'parametros.habite-se'],
    })
  })

  it('marca e desmarca todas as telas de um módulo', async () => {
    abrirGrupos()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { id: 4, nome: 'Só relatórios', telas: [], usuarios: 0 },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Novo grupo' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Só administração')
    const administracao = within(dialogo).getByRole('group', { name: 'Administração' })
    await userEvent.click(within(administracao).getByRole('button', { name: 'Marcar todas' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/grupos', {
      nome: 'Só administração',
      telas: ['administracao.usuarios', 'administracao.grupos'],
    })
  })

  it('não oferece Empresas nem Tabelas Comuns, que são só do superadmin', async () => {
    abrirGrupos()

    await userEvent.click(await screen.findByRole('button', { name: 'Novo grupo' }))
    const dialogo = await screen.findByRole('dialog')

    const administracao = within(within(dialogo).getByRole('group', { name: 'Administração' }))
    expect(administracao.getByRole('checkbox', { name: 'Usuários' })).toBeInTheDocument()
    expect(administracao.queryByRole('checkbox', { name: 'Empresas' })).not.toBeInTheDocument()
    expect(within(dialogo).queryByRole('checkbox', { name: 'Cidades' })).not.toBeInTheDocument()
    expect(
      within(dialogo).queryByRole('checkbox', { name: 'Tipos de DAM' }),
    ).not.toBeInTheDocument()
  })

  it('abre a alteração com as telas do grupo marcadas', async () => {
    abrirGrupos()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: gruposMock[2] })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar Tabelas' }))
    const dialogo = await screen.findByRole('dialog')
    const tabelas = within(within(dialogo).getByRole('group', { name: 'Tabelas' }))
    expect(tabelas.getByRole('checkbox', { name: 'UFM' })).toBeChecked()
    expect(tabelas.getByRole('checkbox', { name: 'Convênios' })).not.toBeChecked()

    await userEvent.click(tabelas.getByRole('checkbox', { name: 'UFM' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(put).toHaveBeenCalledWith('/grupos/3', { nome: 'Tabelas', telas: ['tabelas.inss'] })
  })

  it('o grupo do sistema não pode ser alterado nem excluído', async () => {
    abrirGrupos()

    const linha = (await screen.findByRole('cell', { name: /Administrador/ })).closest('tr')!
    expect(linha).toHaveTextContent('Sistema')
    expect(linha).toHaveTextContent('Acesso total')
    expect(within(linha).queryByRole('button', { name: /Alterar/ })).not.toBeInTheDocument()
    expect(within(linha).queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
  })

  it('exclui um grupo depois de confirmar', async () => {
    abrirGrupos()
    const remover = vi.spyOn(api, 'delete').mockResolvedValue({ data: null })

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Lançamentos' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir' }))

    expect(remover).toHaveBeenCalledWith('/grupos/1')
  })
})

describe('parâmetros › receitas', () => {
  const opcoes = {
    receitas: [
      { id: 10, descricao: 'Imposto sobre Serviços', sigla: 'ISS' },
      { id: 11, descricao: 'IPTU', sigla: null },
    ],
  }
  const semReceitas = Object.fromEntries(
    [
      'iss',
      'taxa',
      'tll',
      'irpf',
      'irpj',
      'inss',
      'itbi',
      'habite',
      'iptu',
      'tcl',
      'tcc',
      'tip',
      'tlp',
    ].map((chave) => [chave, null]),
  )

  function abrirReceitas(receitas: Record<string, number | null> = semReceitas) {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/parametros/receitas': { receitas },
      '/parametros/receitas/opcoes': opcoes,
    })
    renderizar(<App />, '/parametros/receitas')
  }

  it('abre o formulário com as receitas gravadas', async () => {
    abrirReceitas({ ...semReceitas, iss: 10 })

    expect(await screen.findByRole('combobox', { name: 'ISS' })).toHaveTextContent(
      'Imposto sobre Serviços (ISS)',
    )
    expect(screen.getByRole('combobox', { name: 'IPTU' })).toHaveTextContent('Sem receita')
    expect(screen.getAllByRole('combobox')).toHaveLength(13)
  })

  it('salva mantendo as receitas escolhidas', async () => {
    abrirReceitas({ ...semReceitas, iss: 10, iptu: 11 })
    const put = vi
      .spyOn(api, 'put')
      .mockResolvedValue({ data: { receitas: { ...semReceitas, iss: 10, iptu: 11 } } })

    await screen.findByRole('combobox', { name: 'ISS' })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(put).toHaveBeenCalledWith('/parametros/receitas', {
      receitas: { ...semReceitas, iss: 10, iptu: 11 },
    })
  })

  it('mostra no campo o erro devolvido pelo servidor', async () => {
    abrirReceitas()
    vi.spyOn(api, 'put').mockRejectedValue(
      erroHttp(422, { message: 'erro', errors: { 'receitas.iss': ['Receita não encontrada.'] } }),
    )

    await screen.findByRole('combobox', { name: 'ISS' })
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Receita não encontrada.')).toBeInTheDocument()
  })
})

describe('administração › tabelas comuns › cidades', () => {
  const cidades = [
    { id: 2, codigo_ibge: '1100015', nome: "Alta Floresta D'Oeste", uf: 'RO' },
    { id: 3, codigo_ibge: '3509502', nome: 'Campinas', uf: 'SP' },
    { id: 1, codigo_ibge: '3550308', nome: 'São Paulo', uf: 'SP' },
  ]

  function abrirCidades() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/cidades': { data: cidades },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/cidades')
  }

  it('lista as cidades com UF e código do IBGE', async () => {
    abrirCidades()

    const linha = (await screen.findByRole('cell', { name: 'Campinas' })).closest('tr')!
    expect(linha).toHaveTextContent('SP')
    expect(linha).toHaveTextContent('3509502')
    expect(screen.getByText('3 registros')).toBeInTheDocument()
  })

  it('busca pelo código do IBGE', async () => {
    abrirCidades()
    await screen.findByRole('cell', { name: 'Campinas' })

    await userEvent.type(screen.getByLabelText('Busca rápida'), '3550308')

    expect(screen.getByRole('cell', { name: 'São Paulo' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Campinas' })).not.toBeInTheDocument()
  })

  it('filtra por UF pelo menu Filtros', async () => {
    abrirCidades()
    await screen.findByRole('cell', { name: 'Campinas' })

    await abrirMenu('Filtros')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'RO' }))
    // Com o menu aberto, o Radix esconde o resto da página: fecha antes de conferir.
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('cell', { name: "Alta Floresta D'Oeste" })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Campinas' })).not.toBeInTheDocument()
  })

  it('cadastra uma cidade escolhendo a UF', async () => {
    abrirCidades()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { id: 4, codigo_ibge: '3304557', nome: 'Rio de Janeiro', uf: 'RJ' },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Nova cidade' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Código IBGE'), '3304557')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Rio de Janeiro')
    await userEvent.click(within(dialogo).getByRole('combobox', { name: 'UF' }))
    await userEvent.click(await screen.findByRole('option', { name: 'RJ' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/administracao/tabelas-comuns/cidades', {
      codigo_ibge: '3304557',
      nome: 'Rio de Janeiro',
      uf: 'RJ',
    })
  })

  it('não cadastra cidade sem UF nem com código IBGE incompleto', async () => {
    abrirCidades()
    const post = vi.spyOn(api, 'post')

    await userEvent.click(await screen.findByRole('button', { name: 'Nova cidade' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Código IBGE'), '123')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'X')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(await within(dialogo).findByText('O código do IBGE tem 7 dígitos.')).toBeInTheDocument()
    expect(within(dialogo).getByText('Escolha a UF.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('altera nome e UF com o código IBGE só para leitura', async () => {
    abrirCidades()
    const put = vi.spyOn(api, 'put').mockResolvedValue({
      data: { id: 3, codigo_ibge: '3509502', nome: 'Campinas (SP)', uf: 'MG' },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar Campinas' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText('Código IBGE')).toHaveValue('3509502')
    expect(within(dialogo).getByLabelText('Código IBGE')).toBeDisabled()
    expect(within(dialogo).getByRole('combobox', { name: 'UF' })).toHaveTextContent('SP')

    const nome = within(dialogo).getByLabelText('Nome')
    await userEvent.clear(nome)
    await userEvent.type(nome, 'Campinas (SP)')
    await userEvent.click(within(dialogo).getByRole('combobox', { name: 'UF' }))
    await userEvent.click(await screen.findByRole('option', { name: 'MG' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(put).toHaveBeenCalledWith('/administracao/tabelas-comuns/cidades/3', {
      nome: 'Campinas (SP)',
      uf: 'MG',
    })
  })
})

describe('administração › tabelas comuns › bancos', () => {
  const bancos = [
    { id: 1, codigo: '0001', nome: 'Banco do Brasil S.A.' },
    { id: 2, codigo: '0341', nome: 'Itaú Unibanco S.A.' },
  ]

  function abrirBancos() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/bancos': { data: bancos },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/bancos')
  }

  it('lista os bancos com o código de compensação', async () => {
    abrirBancos()

    const linha = (await screen.findByRole('cell', { name: 'Banco do Brasil S.A.' })).closest('tr')!
    expect(linha).toHaveTextContent('0001')
    expect(screen.getByText('2 registros')).toBeInTheDocument()
  })

  it('busca pelo código', async () => {
    abrirBancos()
    await screen.findByRole('cell', { name: 'Banco do Brasil S.A.' })

    await userEvent.type(screen.getByLabelText('Busca rápida'), '0341')

    expect(screen.getByRole('cell', { name: 'Itaú Unibanco S.A.' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Banco do Brasil S.A.' })).not.toBeInTheDocument()
  })

  it('cadastra um banco e mostra no campo o erro do servidor', async () => {
    abrirBancos()
    const post = vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, {
        message: 'erro',
        errors: { codigo: ['Já existe um banco com este código.'] },
      }),
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Novo banco' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Código de compensação'), '0001')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Banco do Brasil S.A.')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/administracao/tabelas-comuns/bancos', {
      codigo: '0001',
      nome: 'Banco do Brasil S.A.',
    })
    expect(
      await within(dialogo).findByText('Já existe um banco com este código.'),
    ).toBeInTheDocument()
  })
})

describe('administração › tabelas comuns › cnae', () => {
  const atividade = {
    divisao: null,
    grupo: null,
    classe: null,
    subclasse: null,
    versao: '2.3',
    ativo: true,
  }
  const cnae = [
    { ...atividade, id: 1, nivel: 'secao', codigo: 'P', secao: 'P', denominacao: 'EDUCAÇÃO' },
    {
      ...atividade,
      id: 2,
      nivel: 'subclasse',
      codigo: '8593-7/00',
      secao: 'P',
      divisao: '85',
      grupo: '85.9',
      classe: '85.93-7',
      subclasse: '8593-7/00',
      denominacao: 'Ensino de idiomas',
    },
    {
      ...atividade,
      id: 3,
      nivel: 'secao',
      codigo: 'A',
      secao: 'A',
      denominacao: 'AGRICULTURA',
      versao: '2.2',
      ativo: false,
    },
  ]

  function abrirCnae() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/cnae': { data: cnae },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/cnae')
  }

  it('lista as atividades com nível, versão e situação', async () => {
    abrirCnae()

    const linha = (await screen.findByRole('cell', { name: 'Ensino de idiomas' })).closest('tr')!
    expect(linha).toHaveTextContent('8593-7/00')
    expect(linha).toHaveTextContent('Subclasse')
    expect(linha).toHaveTextContent('2.3')
    expect(screen.getByRole('cell', { name: 'AGRICULTURA' }).closest('tr')).toHaveTextContent(
      'Inativa',
    )
  })

  it('busca pelo código sem pontuação', async () => {
    abrirCnae()
    await screen.findByRole('cell', { name: 'Ensino de idiomas' })

    await userEvent.type(screen.getByLabelText('Busca rápida'), '8593700')

    expect(screen.getByRole('cell', { name: 'Ensino de idiomas' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'EDUCAÇÃO' })).not.toBeInTheDocument()
  })

  it('filtra por versão e por nível', async () => {
    abrirCnae()
    await screen.findByRole('cell', { name: 'Ensino de idiomas' })

    await abrirMenu('Filtros')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: '2.3' }))
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'Seção' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('cell', { name: 'EDUCAÇÃO' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Ensino de idiomas' })).not.toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'AGRICULTURA' })).not.toBeInTheDocument()
  })

  it('cadastra uma atividade com a versão mais nova já preenchida', async () => {
    abrirCnae()
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: cnae[1] })

    await userEvent.click(await screen.findByRole('button', { name: 'Nova atividade' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText('Versão')).toHaveValue('2.3')
    await userEvent.type(within(dialogo).getByLabelText('Seção'), 'p')
    await userEvent.type(within(dialogo).getByLabelText('Divisão'), '85')
    await userEvent.type(within(dialogo).getByLabelText('Grupo'), '85.9')
    await userEvent.type(
      within(dialogo).getByLabelText('Denominação'),
      'Outras atividades de ensino',
    )
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/administracao/tabelas-comuns/cnae', {
      secao: 'P',
      divisao: '85',
      grupo: '85.9',
      classe: null,
      subclasse: null,
      denominacao: 'Outras atividades de ensino',
      versao: '2.3',
      ativo: true,
    })
  })

  it('confere o formato de cada nível antes de enviar', async () => {
    abrirCnae()
    const post = vi.spyOn(api, 'post')

    await userEvent.click(await screen.findByRole('button', { name: 'Nova atividade' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Seção'), 'P')
    await userEvent.type(within(dialogo).getByLabelText('Classe'), '8593-7')
    await userEvent.type(within(dialogo).getByLabelText('Denominação'), 'X')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(
      await within(dialogo).findByText('A classe segue o formato 85.93-7.'),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })
})

describe('administração › tabelas comuns › lista de serviços', () => {
  const itens = [
    { codigo: '01', tipo: 'item', descricao: 'Serviços de informática e congêneres.' },
    { codigo: '01.01', tipo: 'subitem', descricao: 'Análise e desenvolvimento de sistemas.' },
    { codigo: '01.02', tipo: 'subitem', descricao: 'Programação.' },
  ]

  function abrirLista() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/lista-de-servicos': { data: itens },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/lista-de-servicos')
  }

  it('lista os itens na ordem do código', async () => {
    abrirLista()

    await screen.findByRole('cell', { name: 'Programação.' })
    const codigos = screen
      .getAllByRole('row')
      .slice(1)
      .map((linha) => within(linha).getAllByRole('cell')[0].textContent)
    expect(codigos).toEqual(['01', '01.01', '01.02'])
  })

  it('busca pelo código sem o ponto', async () => {
    abrirLista()
    await screen.findByRole('cell', { name: 'Programação.' })

    await userEvent.type(screen.getByLabelText('Busca rápida'), '0102')

    expect(screen.getByRole('cell', { name: 'Programação.' })).toBeInTheDocument()
    expect(
      screen.queryByRole('cell', { name: 'Análise e desenvolvimento de sistemas.' }),
    ).not.toBeInTheDocument()
  })

  it('altera a descrição com o código só para leitura', async () => {
    abrirLista()
    const put = vi
      .spyOn(api, 'put')
      .mockResolvedValue({ data: { ...itens[2], descricao: 'Programação de computadores.' } })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar 01.02' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText('Código')).toHaveValue('01.02')
    expect(within(dialogo).getByLabelText('Código')).toBeDisabled()

    const descricao = within(dialogo).getByLabelText('Descrição')
    await userEvent.clear(descricao)
    await userEvent.type(descricao, 'Programação de computadores.')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(put).toHaveBeenCalledWith('/administracao/tabelas-comuns/lista-de-servicos/01.02', {
      descricao: 'Programação de computadores.',
    })
  })

  it('não salva sem descrição', async () => {
    abrirLista()
    const put = vi.spyOn(api, 'put')

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar 01' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.clear(within(dialogo).getByLabelText('Descrição'))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(await within(dialogo).findByText('Informe a descrição.')).toBeInTheDocument()
    expect(put).not.toHaveBeenCalled()
  })

  it('cadastra um subitem', async () => {
    abrirLista()
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { codigo: '01.03', tipo: 'subitem', descricao: 'Hospedagem.' } })

    await userEvent.click(await screen.findByRole('button', { name: 'Novo item' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Código'), '01.03')
    await userEvent.type(within(dialogo).getByLabelText('Descrição'), 'Hospedagem.')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/administracao/tabelas-comuns/lista-de-servicos', {
      codigo: '01.03',
      descricao: 'Hospedagem.',
    })
  })
})

describe('administração › tabelas comuns › selic', () => {
  const taxas = [
    { id: 3, ano: 2026, mes: 2, valor: null },
    { id: 2, ano: 2026, mes: 1, valor: '1.16' },
    { id: 1, ano: 2025, mes: 12, valor: '1.12' },
  ]

  function abrirSelic(dados = taxas) {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/selic': { data: dados },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/selic')
  }

  it('lista as taxas com competência, mês e percentual', async () => {
    abrirSelic()

    const linha = (await screen.findByRole('cell', { name: '01/2026' })).closest('tr')!
    expect(linha).toHaveTextContent('Janeiro de 2026')
    expect(linha).toHaveTextContent('1,16%')
    expect(screen.getByRole('cell', { name: '02/2026' }).closest('tr')).toHaveTextContent('—')
  })

  it('filtra por ano pelo menu Filtros', async () => {
    abrirSelic()
    await screen.findByRole('cell', { name: '01/2026' })

    await abrirMenu('Filtros')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: '2025' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('cell', { name: '12/2025' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: '01/2026' })).not.toBeInTheDocument()
  })

  it('avisa quando a tabela está vazia', async () => {
    abrirSelic([])

    expect(await screen.findByText('Nenhuma taxa cadastrada')).toBeInTheDocument()
  })

  it('cadastra a taxa de um mês com vírgula decimal', async () => {
    abrirSelic()
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { id: 4, ano: 2026, mes: 3, valor: '0.87' } })

    await userEvent.click(await screen.findByRole('button', { name: 'Nova taxa' }))
    const dialogo = await screen.findByRole('dialog')
    const ano = within(dialogo).getByLabelText('Ano')
    await userEvent.clear(ano)
    await userEvent.type(ano, '2026')
    await userEvent.click(within(dialogo).getByRole('combobox', { name: 'Mês' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Março' }))
    await userEvent.type(within(dialogo).getByLabelText('Taxa (%)'), '0,87')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/administracao/tabelas-comuns/selic', {
      ano: 2026,
      mes: 3,
      valor: '0.87',
    })
  })

  it('não cadastra taxa sem o mês', async () => {
    abrirSelic()
    const post = vi.spyOn(api, 'post')

    await userEvent.click(await screen.findByRole('button', { name: 'Nova taxa' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(await within(dialogo).findByText('Escolha o mês.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })
})

describe('administração › tabelas comuns › segmentos', () => {
  const segmentos = [
    { codigo: '1', descricao: 'PREFEITURA' },
    { codigo: '2', descricao: 'SANEAMENTO' },
    { codigo: '9', descricao: 'USO INTERNO DO BANCO' },
  ]

  function abrirSegmentos() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/segmentos': { data: segmentos },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/segmentos')
  }

  it('lista os segmentos na ordem do código', async () => {
    abrirSegmentos()

    await screen.findByRole('cell', { name: 'PREFEITURA' })
    const codigos = screen
      .getAllByRole('row')
      .slice(1)
      .map((linha) => within(linha).getAllByRole('cell')[0].textContent)
    expect(codigos).toEqual(['1', '2', '9'])
  })

  it('altera a descrição com o código só para leitura', async () => {
    abrirSegmentos()
    const put = vi
      .spyOn(api, 'put')
      .mockResolvedValue({ data: { codigo: '2', descricao: 'SANEAMENTO BÁSICO' } })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar SANEAMENTO' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText('Código')).toHaveValue('2')
    expect(within(dialogo).getByLabelText('Código')).toBeDisabled()

    const descricao = within(dialogo).getByLabelText('Descrição')
    await userEvent.clear(descricao)
    await userEvent.type(descricao, 'SANEAMENTO BÁSICO')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(put).toHaveBeenCalledWith('/administracao/tabelas-comuns/segmentos/2', {
      descricao: 'SANEAMENTO BÁSICO',
    })
  })

  it('não salva sem descrição', async () => {
    abrirSegmentos()
    const put = vi.spyOn(api, 'put')

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar PREFEITURA' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.clear(within(dialogo).getByLabelText('Descrição'))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(await within(dialogo).findByText('Informe a descrição.')).toBeInTheDocument()
    expect(put).not.toHaveBeenCalled()
  })

  it('cadastra um segmento', async () => {
    abrirSegmentos()
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { codigo: '4', descricao: 'TELECOMUNICACOES' } })

    await userEvent.click(await screen.findByRole('button', { name: 'Novo segmento' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Código'), '4')
    await userEvent.type(within(dialogo).getByLabelText('Descrição'), 'TELECOMUNICACOES')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/administracao/tabelas-comuns/segmentos', {
      codigo: '4',
      descricao: 'TELECOMUNICACOES',
    })
  })
})

describe('administração › tabelas comuns › numeração de notas', () => {
  it('lista os tipos de numeração na ordem do código', async () => {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/numeracao-de-notas': {
        data: [
          { codigo: 'A', descricao: 'AUTOMÁTICO' },
          { codigo: 'D', descricao: 'POR DATA' },
          { codigo: 'N', descricao: 'NORMAL' },
        ],
      },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/numeracao-de-notas')

    expect(await screen.findByRole('cell', { name: 'POR DATA' })).toBeInTheDocument()
    const codigos = screen
      .getAllByRole('row')
      .slice(1)
      .map((linha) => within(linha).getAllByRole('cell')[0].textContent)
    expect(codigos).toEqual(['A', 'D', 'N'])
    expect(screen.getByText('3 registros')).toBeInTheDocument()
  })

  it('cadastra uma numeração com o código em maiúscula', async () => {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/numeracao-de-notas': { data: [] },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/numeracao-de-notas')
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { codigo: 'S', descricao: 'POR SÉRIE' } })

    await userEvent.click(await screen.findByRole('button', { name: 'Nova numeração' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Código'), 's')
    await userEvent.type(within(dialogo).getByLabelText('Descrição'), 'POR SÉRIE')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/administracao/tabelas-comuns/numeracao-de-notas', {
      codigo: 'S',
      descricao: 'POR SÉRIE',
    })
  })
})

describe('administração › tabelas comuns › tipos de dam', () => {
  it('lista os tipos de DAM na ordem do código', async () => {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/tipos-de-dam': {
        data: [
          { codigo: 1, descricao: 'NOTA FISCAL' },
          { codigo: 2, descricao: 'ALVARÁ' },
          { codigo: 3, descricao: 'IPTU' },
        ],
      },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/tipos-de-dam')

    expect(await screen.findByRole('cell', { name: 'ALVARÁ' })).toBeInTheDocument()
    const codigos = screen
      .getAllByRole('row')
      .slice(1)
      .map((linha) => within(linha).getAllByRole('cell')[0].textContent)
    expect(codigos).toEqual(['1', '2', '3'])
  })

  it('cadastra um tipo de DAM com código numérico', async () => {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': usuario,
      '/administracao/tabelas-comuns/tipos-de-dam': { data: [] },
    })
    renderizar(<App />, '/administracao/tabelas-comuns/tipos-de-dam')
    const post = vi
      .spyOn(api, 'post')
      .mockResolvedValue({ data: { codigo: 8, descricao: 'MULTAS' } })

    await userEvent.click(await screen.findByRole('button', { name: 'Novo tipo de DAM' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Código'), '8')
    await userEvent.type(within(dialogo).getByLabelText('Descrição'), 'MULTAS')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(post).toHaveBeenCalledWith('/administracao/tabelas-comuns/tipos-de-dam', {
      codigo: 8,
      descricao: 'MULTAS',
    })
  })
})

describe('recuperação de senha', () => {
  function abrirLogin(rota = '/login') {
    mockGet({ '/tenant': { id: 'lemarq', nome: 'Lemarq' } })
    renderizar(<App />, rota)
  }

  it('o login tem o link de recuperação', async () => {
    abrirLogin()

    await userEvent.click(await screen.findByRole('link', { name: 'Esqueci minha senha' }))

    expect(await screen.findByRole('heading', { name: 'Esqueci minha senha' })).toBeInTheDocument()
  })

  it('pede o link informando o CPF e confirma o envio', async () => {
    abrirLogin('/esqueci-senha')
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { message: 'Se o CPF estiver cadastrado nesta prefeitura, enviamos um e-mail.' },
    })

    await userEvent.type(await screen.findByLabelText('CPF'), '52998224725')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(post).toHaveBeenCalledWith('/senha/esqueci', { cpf: '52998224725' })
    expect(await screen.findByRole('heading', { name: 'Confira o seu e-mail' })).toBeInTheDocument()
  })

  it('recusa CPF inválido antes de enviar', async () => {
    abrirLogin('/esqueci-senha')
    const post = vi.spyOn(api, 'post')

    await userEvent.type(await screen.findByLabelText('CPF'), '11111111111')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(await screen.findByText('Informe um CPF válido.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('redefine a senha com o token do endereço', async () => {
    abrirLogin('/redefinir-senha?token=tok-abc&cpf=52998224725')
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { message: 'Senha alterada.' } })

    await userEvent.type(await screen.findByLabelText('Nova senha'), 'senha-nova-forte')
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'senha-nova-forte')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }))

    expect(post).toHaveBeenCalledWith('/senha/redefinir', {
      cpf: '52998224725',
      token: 'tok-abc',
      password: 'senha-nova-forte',
      password_confirmation: 'senha-nova-forte',
    })
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('avisa quando as senhas não conferem', async () => {
    abrirLogin('/redefinir-senha?token=tok-abc&cpf=52998224725')
    const post = vi.spyOn(api, 'post')

    await userEvent.type(await screen.findByLabelText('Nova senha'), 'senha-nova-forte')
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'outra-senha')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }))

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('sem token no endereço, volta para pedir um link', async () => {
    abrirLogin('/redefinir-senha')

    expect(await screen.findByRole('heading', { name: 'Esqueci minha senha' })).toBeInTheDocument()
  })

  it('mostra o erro do servidor quando o link não vale mais', async () => {
    abrirLogin('/redefinir-senha?token=velho&cpf=52998224725')
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { token: ['Link inválido ou expirado. Peça um novo.'] } }),
    )

    await userEvent.type(await screen.findByLabelText('Nova senha'), 'senha-nova-forte')
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'senha-nova-forte')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Link inválido ou expirado.')
  })
})

describe('minha conta', () => {
  function entrarLogado() {
    setToken('tok-123')
    mockGet({ '/tenant': { id: 'lemarq', nome: 'Lemarq' }, '/me': usuario })
    renderizar(<App />)
  }

  async function abrirMinhaConta() {
    entrarLogado()
    await abrirMenu('Menu do usuário')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Minha conta' }))
    return screen.findByRole('dialog')
  }

  it('o menu do rodapé mostra o CPF, Minha conta e Sair', async () => {
    entrarLogado()

    await abrirMenu('Menu do usuário')

    expect(await screen.findByRole('menuitem', { name: /529\.982\.247-25/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Minha conta' })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
  })

  it('salva nome e e-mail em Meus dados', async () => {
    const dialogo = await abrirMinhaConta()
    const put = vi
      .spyOn(api, 'put')
      .mockResolvedValue({ data: { ...usuario, name: 'Fiscal Novo' } })

    const nome = within(dialogo).getByLabelText(/Nome/)
    await userEvent.clear(nome)
    await userEvent.type(nome, 'Fiscal Novo')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    expect(put).toHaveBeenCalledWith('/me', {
      name: 'Fiscal Novo',
      email: 'fiscal@stm.localhost',
    })
  })

  it('troca a senha na aba Senha', async () => {
    const dialogo = await abrirMinhaConta()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { message: 'Senha alterada.' } })

    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Senha' }))
    await userEvent.type(within(dialogo).getByLabelText(/Senha atual/), 'senha-antiga')
    await userEvent.type(within(dialogo).getByLabelText(/Nova senha/), 'senha-nova-forte')
    await userEvent.type(within(dialogo).getByLabelText(/Confirmar nova senha/), 'senha-nova-forte')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Trocar senha' }))

    expect(put).toHaveBeenCalledWith('/me/senha', {
      senha_atual: 'senha-antiga',
      password: 'senha-nova-forte',
      password_confirmation: 'senha-nova-forte',
    })
  })

  it('avisa quando a confirmação não confere', async () => {
    const dialogo = await abrirMinhaConta()
    const put = vi.spyOn(api, 'put')

    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Senha' }))
    await userEvent.type(within(dialogo).getByLabelText(/Senha atual/), 'senha-antiga')
    await userEvent.type(within(dialogo).getByLabelText(/Nova senha/), 'senha-nova-forte')
    await userEvent.type(within(dialogo).getByLabelText(/Confirmar nova senha/), 'outra-senha')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Trocar senha' }))

    expect(await within(dialogo).findByText('As senhas não conferem.')).toBeInTheDocument()
    expect(put).not.toHaveBeenCalled()
  })

  it('mostra o erro do servidor na senha atual', async () => {
    const dialogo = await abrirMinhaConta()
    vi.spyOn(api, 'put').mockRejectedValue(
      erroHttp(422, { errors: { senha_atual: ['Senha atual incorreta.'] } }),
    )

    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Senha' }))
    await userEvent.type(within(dialogo).getByLabelText(/Senha atual/), 'errada')
    await userEvent.type(within(dialogo).getByLabelText(/Nova senha/), 'senha-nova-forte')
    await userEvent.type(within(dialogo).getByLabelText(/Confirmar nova senha/), 'senha-nova-forte')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Trocar senha' }))

    expect(await within(dialogo).findByText('Senha atual incorreta.')).toBeInTheDocument()
  })

  it('envia a foto do usuário', async () => {
    const dialogo = await abrirMinhaConta()
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { foto: '/api/fotos/abc.png' } })

    const imagem = new File(['conteudo'], 'retrato.png', { type: 'image/png' })
    await userEvent.upload(within(dialogo).getByLabelText('Foto'), imagem)

    expect(post).toHaveBeenCalledWith('/me/foto', expect.any(FormData))
    expect((post.mock.calls[0][1] as FormData).get('foto')).toBe(imagem)
  })

  it('remove a foto quando já existe uma', async () => {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'lemarq', nome: 'Lemarq' },
      '/me': { ...usuario, foto: '/api/fotos/abc.png' },
    })
    renderizar(<App />)
    const remover = vi.spyOn(api, 'delete').mockResolvedValue({ data: { foto: null } })

    await abrirMenu('Menu do usuário')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Minha conta' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Remover' }))

    expect(remover).toHaveBeenCalledWith('/me/foto')
  })
})
