import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { api, getToken, setToken } from '@/lib/api'
import { enderecoDaPrefeitura, subdominioDaPrefeitura } from '@/lib/prefeitura'
import Landing from '@/pages/Landing'

const usuario = {
  id: 1,
  name: 'Fiscal Teste',
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

  it('monta o endereço de login da prefeitura', () => {
    expect(enderecoDaPrefeitura('minha-cidade')).toBe('http://minha-cidade.localhost:5173/login')
  })
})

describe('landing page', () => {
  it('aparece quando a prefeitura do endereço não existe', async () => {
    mockGet({ '/tenant': erroHttp(404, { message: 'Prefeitura não encontrada.' }) })
    renderizar(<App />, '/login')

    expect(await screen.findByText('Prefeitura não encontrada')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('A gestão tributária')
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
  })

  it('mostra erro de conexão quando o servidor falha', async () => {
    mockGet({ '/tenant': erroHttp(500, {}) })
    renderizar(<App />)

    expect(await screen.findByText('Não foi possível conectar ao servidor')).toBeInTheDocument()
  })

  it('valida o endereço informado', async () => {
    renderizar(<Landing />)

    await userEvent.type(screen.getByLabelText('Endereço da prefeitura'), 'minha cidade!')
    await userEvent.click(screen.getByRole('button', { name: 'Continuar' }))

    expect(await screen.findByText('Use apenas letras, números e hífen.')).toBeInTheDocument()
  })
})

describe('login', () => {
  it('redireciona para o login quando não há sessão', async () => {
    mockGet({ '/tenant': { id: 'lemarq' } })
    renderizar(<App />)

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('valida os campos antes de enviar', async () => {
    mockGet({ '/tenant': { id: 'lemarq' } })
    const post = vi.spyOn(api, 'post')
    renderizar(<App />, '/login')

    await userEvent.click(await screen.findByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('faz login, guarda o token e abre a página inicial', async () => {
    mockGet({ '/tenant': { id: 'lemarq' } })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { token: 'tok-123', usuario } })
    renderizar(<App />, '/login')

    await userEvent.type(await screen.findByLabelText('E-mail'), usuario.email)
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Fiscal Teste')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/login', { email: usuario.email, password: 'segredo' })
    expect(getToken()).toBe('tok-123')
    expect(screen.getByRole('heading', { name: 'Olá, Fiscal' })).toBeInTheDocument()
  })

  it('mostra a mensagem do servidor quando as credenciais são inválidas', async () => {
    mockGet({ '/tenant': { id: 'lemarq' } })
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { email: ['E-mail ou senha inválidos.'] } }),
    )
    renderizar(<App />, '/login')

    await userEvent.type(await screen.findByLabelText('E-mail'), usuario.email)
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
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
      'Cadastros',
      'Tributos',
      'Arrecadação',
      'Dívida ativa',
      'Administração',
    ]) {
      expect(await screen.findByRole('button', { name: modulo })).toBeInTheDocument()
    }
    expect(sidebar().getByRole('link', { name: 'Início' })).toHaveAttribute('data-active', 'true')
    expect(sidebar().getByRole('link', { name: 'Relatórios' })).toHaveAttribute(
      'href',
      '/relatorios',
    )
  })

  it('abre uma tela do menu com breadcrumb', async () => {
    entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Tributos' }))
    await userEvent.click(await screen.findByRole('link', { name: 'IPTU' }))

    expect(await screen.findByText('Esta tela ainda está em construção.')).toBeInTheDocument()
    const trilha = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(trilha).toHaveTextContent('Tributos')
    expect(trilha).toHaveTextContent('IPTU')
  })

  it('lista as prefeituras do usuário no seletor', async () => {
    entrarLogado()

    await abrirMenu(/Lemarq/)

    expect(await screen.findByRole('menuitem', { name: /Prefeitura Teste/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Lemarq/ })).toBeInTheDocument()
  })
})
