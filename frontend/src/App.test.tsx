import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { ThemeProvider } from 'next-themes'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { api, getToken, setToken } from '@/lib/api'
import { subdominioDaPrefeitura } from '@/lib/prefeitura'
import Landing from '@/pages/Landing'

const usuario = {
  id: 1,
  name: 'Fiscal Teste',
  cpf: '52998224725',
  email: 'fiscal@stm.localhost',
  prefeituras: [
    { id: 'lemarq', dominio: 'lemarq.localhost' },
    { id: 'prefeitura_teste', dominio: 'prefeitura-teste.localhost' },
  ],
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
    renderizar(<App />, '/parametros/empresa')

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

    for (const modulo of ['Parâmetros', 'Tabelas', 'Lançamentos', 'Relatórios', 'Administração']) {
      expect(await screen.findByRole('button', { name: modulo })).toBeInTheDocument()
    }
    for (const removido of ['Cadastros', 'Tributos', 'Arrecadação', 'Dívida ativa']) {
      expect(screen.queryByRole('button', { name: removido })).not.toBeInTheDocument()
    }
    expect(sidebar().getByRole('link', { name: 'Início' })).toHaveAttribute('data-active', 'true')
  })

  it('abre uma tela do menu com breadcrumb', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Administração' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Usuários' }))

    expect(await screen.findByText('Esta tela ainda está em construção.')).toBeInTheDocument()
    const trilha = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(trilha).toHaveTextContent('Administração')
    expect(trilha).toHaveTextContent('Usuários')
  })

  it('lista as telas de Parâmetros no submenu', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Parâmetros' }))

    expect(await screen.findByRole('link', { name: 'Empresa' })).toHaveAttribute(
      'href',
      '/parametros/empresa',
    )
    expect(screen.getByRole('link', { name: 'Juros e Multa' })).toHaveAttribute(
      'href',
      '/parametros/juros-e-multa',
    )
    expect(screen.getByRole('link', { name: 'Base Legal' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Empresa' }).querySelector('svg')).not.toBeNull()
  })

  it('abre uma tela de submenu aninhado em Tabelas', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Tabelas' }))
    expect(await screen.findByRole('link', { name: 'Receitas Tributárias' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Tabelas internas' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Cidades' }))

    expect(await screen.findByText('Esta tela ainda está em construção.')).toBeInTheDocument()
    const trilha = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(trilha).toHaveTextContent('Tabelas')
    expect(trilha).toHaveTextContent('Tabelas internas')
    expect(trilha).toHaveTextContent('Cidades')
    expect(within(trilha).getByRole('link', { name: 'Tabelas internas' })).toHaveAttribute(
      'href',
      '/tabelas/internas/cidades',
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
