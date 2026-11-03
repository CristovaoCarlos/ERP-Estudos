import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { render, screen, within } from '@testing-library/vue'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from 'vitest'
import type { Component } from 'vue'
import { createMemoryHistory } from 'vue-router'

import App from '@/App.vue'
import { api, getToken, registrarRequisicao, setToken } from '@/lib/api'
import { permissaoDaTela, telas } from '@/lib/navegacao'
import { subdominioDaPrefeitura } from '@/lib/prefeitura'
import { ATIVIDADE_KEY } from '@/lib/sessao'
import Landing from '@/pages/Landing.vue'
import { hoje } from '@/pages/lancamentos/vendas/esquema'
import { criarRouter } from '@/router'

const usuario = {
  id: 1,
  name: 'Fiscal Teste',
  cpf: '52998224725',
  email: 'fiscal@erp-estudos.localhost',
  foto: null,
  // Superadmin: vê todas as telas, inclusive Administração › Empresas.
  superadmin: true,
  grupos: [] as string[],
  permissoes: telas.filter((tela) => tela.url !== '/').map((tela) => permissaoDaTela(tela.url)),
  prefeituras: [
    { id: 'demo', nome: 'Demo', dominio: 'demo.localhost' },
    { id: 'prefeitura_teste', nome: null, dominio: 'prefeitura-teste.localhost' },
  ],
  inatividade_minutos: 5,
}

/** Usuário comum, só com o grupo de Cadastros. */
const usuarioDeCadastros = {
  ...usuario,
  superadmin: false,
  grupos: ['cadastros'],
  permissoes: telas
    .filter((tela) => tela.url.startsWith('/cadastros/'))
    .map((tela) => permissaoDaTela(tela.url)),
}

/** Monta o componente com vue-query e o router do app, já na rota pedida. */
async function renderizar(componente: Component, rota = '/') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  const router = criarRouter(createMemoryHistory())
  await router.push(rota)
  await router.isReady()
  return render(componente, {
    global: { plugins: [[VueQueryPlugin, { queryClient }], router] },
  })
}

/** A validação dos formulários é assíncrona: a chamada à API vem alguns ticks depois do envio. */
async function esperarChamada(espiao: MockInstance, ...argumentos: unknown[]) {
  await vi.waitFor(() => expect(espiao).toHaveBeenCalledWith(...argumentos))
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

// Abre menus pelo teclado, como um usuário de teclado faria.
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
  localStorage.removeItem('erp_estudos.menu.largura')
})

describe('prefeitura pelo endereço', () => {
  it('identifica o subdomínio da prefeitura', async () => {
    expect(window.location.hostname).toBe('demo.localhost')
    expect(subdominioDaPrefeitura()).toBe('demo')
    expect(subdominioDaPrefeitura('prefeitura-teste.localhost')).toBe('prefeitura-teste')
  })

  it('domínio central não é prefeitura', async () => {
    expect(subdominioDaPrefeitura('localhost')).toBeNull()
    expect(subdominioDaPrefeitura('127.0.0.1')).toBeNull()
  })
})

describe('landing page', () => {
  it('aparece quando a prefeitura do endereço não existe', async () => {
    mockGet({ '/tenant': erroHttp(404, { message: 'Prefeitura não encontrada.' }) })
    await renderizar(App, '/login')

    expect(await screen.findByText('Prefeitura não encontrada')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Toda a tributação do seu município',
    )
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument()
  })

  it('mostra erro de conexão quando o servidor falha', async () => {
    mockGet({ '/tenant': erroHttp(500, {}) })
    await renderizar(App)

    expect(await screen.findByText('Não foi possível conectar ao servidor')).toBeInTheDocument()
  })

  it('não tem campo para escolher a prefeitura', async () => {
    await renderizar(Landing)

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Toda a tributação do seu município',
    )
    expect(screen.queryByLabelText('Endereço da prefeitura')).not.toBeInTheDocument()
    expect(screen.queryByText('Acessar minha prefeitura')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Painel' })).not.toBeInTheDocument()
  })

  it('alterna entre o tema claro e o escuro pelo botão do cabeçalho', async () => {
    await renderizar(Landing)

    await userEvent.click(screen.getByRole('button', { name: 'Mudar para o tema escuro' }))
    expect(document.documentElement).toHaveClass('dark')

    await userEvent.click(screen.getByRole('button', { name: 'Mudar para o tema claro' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(screen.queryByText('Sistema')).not.toBeInTheDocument()
  })
})

describe('login', () => {
  it('sem sessão, a raiz da prefeitura mostra a landing com o botão Painel', async () => {
    mockGet({ '/tenant': { id: 'demo' } })
    await renderizar(App)

    const painel = await screen.findByRole('link', { name: 'Painel' })
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Toda a tributação do seu município',
    )

    await userEvent.click(painel)
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('redireciona para o login ao abrir uma tela sem sessão', async () => {
    mockGet({ '/tenant': { id: 'demo' } })
    await renderizar(App, '/parametros/receitas')

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('valida os campos antes de enviar', async () => {
    mockGet({ '/tenant': { id: 'demo' } })
    const post = vi.spyOn(api, 'post')
    await renderizar(App, '/login')

    await userEvent.click(await screen.findByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe um CPF válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('faz login, guarda o token e abre a página inicial', async () => {
    mockGet({ '/tenant': { id: 'demo' } })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { token: 'tok-123', usuario } })
    await renderizar(App, '/login')

    const campoCpf = await screen.findByLabelText('CPF')
    await userEvent.type(campoCpf, '52998224725')
    expect(campoCpf).toHaveValue('529.982.247-25')
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Fiscal Teste')).toBeInTheDocument()
    await esperarChamada(post, '/login', { cpf: '52998224725', password: 'segredo' })
    expect(getToken()).toBe('tok-123')
    expect(screen.getByRole('heading', { name: 'Olá, Fiscal' })).toBeInTheDocument()
  })

  it('mostra a mensagem do servidor quando as credenciais são inválidas', async () => {
    mockGet({ '/tenant': { id: 'demo' } })
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { cpf: ['CPF ou senha inválidos.'] } }),
    )
    await renderizar(App, '/login')

    await userEvent.type(await screen.findByLabelText('CPF'), '529.982.247-25')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('CPF ou senha inválidos.')
    expect(getToken()).toBeNull()
  })

  it('sair revoga a sessão e volta para o login', async () => {
    setToken('tok-123')
    mockGet({ '/tenant': { id: 'demo' }, '/me': usuario })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: null })
    await renderizar(App)

    await abrirMenu('Menu do usuário')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Sair' }))

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    await esperarChamada(post, '/logout')
    expect(getToken()).toBeNull()
  })
})

describe('sessão por inatividade', () => {
  const MINUTO = 60_000

  // Cada teste começa uma hora depois do anterior: a última requisição de um não vale no outro.
  let relogio = Date.now()

  // Só o relógio e o intervalo são falsos: o `setTimeout` real mantém o `findBy*` funcionando.
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] })
    relogio += 60 * MINUTO
    vi.setSystemTime(relogio)
  })
  afterEach(() => {
    vi.useRealTimers()
    localStorage.removeItem(ATIVIDADE_KEY)
  })

  async function entrarLogado() {
    setToken('tok-123')
    mockGet({ '/tenant': { id: 'demo' }, '/me': usuario })
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: null })
    await renderizar(App)
    await screen.findByRole('heading', { name: 'Olá, Fiscal' })
    return post
  }

  it('desloga após 5 minutos sem uso e explica o motivo no login', async () => {
    const post = await entrarLogado()

    vi.advanceTimersByTime(5 * MINUTO)

    expect(await screen.findByText('Sua sessão foi encerrada por inatividade.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(getToken()).toBeNull()
    // Sem requisição há 5 minutos, o servidor já apagou o token: chamar /logout só daria 401.
    expect(post).not.toHaveBeenCalledWith('/logout', expect.anything(), expect.anything())
  })

  it('revoga o token no servidor quando houve requisição dentro do prazo', async () => {
    const post = await entrarLogado()

    vi.advanceTimersByTime(4 * MINUTO)
    registrarRequisicao()
    vi.advanceTimersByTime(MINUTO)

    expect(await screen.findByText('Sua sessão foi encerrada por inatividade.')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/logout', null, {
      headers: { Authorization: 'Bearer tok-123' },
    })
  })

  it('o uso do teclado ou do mouse adia o logout e renova a sessão no servidor', async () => {
    const post = await entrarLogado()

    vi.advanceTimersByTime(4 * MINUTO)
    window.dispatchEvent(new KeyboardEvent('keydown'))
    vi.advanceTimersByTime(4 * MINUTO)

    expect(post).toHaveBeenCalledWith('/sessao/renovar')
    expect(post).not.toHaveBeenCalledWith('/logout', expect.anything(), expect.anything())
    expect(getToken()).toBe('tok-123')
    expect(screen.getByRole('heading', { name: 'Olá, Fiscal' })).toBeInTheDocument()
  })

  it('o uso em outra aba também mantém esta aba logada', async () => {
    await entrarLogado()

    vi.advanceTimersByTime(4 * MINUTO)
    window.dispatchEvent(
      new StorageEvent('storage', { key: ATIVIDADE_KEY, newValue: String(Date.now()) }),
    )
    vi.advanceTimersByTime(4 * MINUTO)

    expect(getToken()).toBe('tok-123')
  })

  it('o login explica quando o servidor recusou o token', async () => {
    mockGet({ '/tenant': { id: 'demo' } })
    await renderizar(App, '/login?sessao=expirada')

    expect(await screen.findByText('Sua sessão expirou. Entre novamente.')).toBeInTheDocument()
  })
})

describe('sistema', () => {
  async function entrarLogado(rota = '/') {
    setToken('tok-123')
    mockGet({ '/tenant': { id: 'demo' }, '/me': usuario })
    await renderizar(App, rota)
  }

  it('mostra os módulos no menu lateral', async () => {
    await entrarLogado()

    for (const modulo of ['Cadastros', 'Lançamentos', 'Relatórios', 'Administração']) {
      expect(await screen.findByRole('button', { name: modulo })).toBeInTheDocument()
    }
    for (const removido of ['Tabelas', 'Parâmetros da Empresa', 'Tributos', 'Dívida ativa']) {
      expect(screen.queryByRole('button', { name: removido })).not.toBeInTheDocument()
    }
    expect(sidebar().getByRole('link', { name: 'Início' })).toHaveAttribute('data-active', 'true')
  })

  it('abre uma tela do menu com breadcrumb', async () => {
    await entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Cadastros' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Clientes' }))

    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument()
    const trilha = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(trilha).toHaveTextContent('Cadastros')
    expect(trilha).toHaveTextContent('Clientes')
  })

  it('endereço fora do menu mostra a tela em construção', async () => {
    await entrarLogado('/cadastros/fornecedores')

    expect(await screen.findByText('Esta tela ainda está em construção.')).toBeInTheDocument()
  })

  it('lista as telas de Cadastros no submenu', async () => {
    await entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Cadastros' }))

    expect(await screen.findByRole('link', { name: 'Clientes' })).toHaveAttribute(
      'href',
      '/cadastros/clientes',
    )
    expect(screen.getByRole('link', { name: 'Produtos' })).toHaveAttribute(
      'href',
      '/cadastros/produtos',
    )
    expect(screen.getByRole('link', { name: 'Vendedores' })).toHaveAttribute(
      'href',
      '/cadastros/vendedores',
    )
    expect(screen.getByRole('link', { name: 'Clientes' }).querySelector('svg')).not.toBeNull()
  })

  it('abre uma tela de submenu aninhado em Tabelas Comuns', async () => {
    await entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Administração' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Tabelas Comuns' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Unidades' }))

    expect(await screen.findByRole('heading', { name: 'Unidades' })).toBeInTheDocument()
    const trilha = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(trilha).toHaveTextContent('Administração')
    expect(trilha).toHaveTextContent('Tabelas Comuns')
    expect(trilha).toHaveTextContent('Unidades')
  })

  it('Tabelas Comuns fica em Administração, abaixo de Empresas', async () => {
    await entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Administração' }))
    await screen.findByRole('link', { name: 'Usuários' })
    const itens = within(screen.getByRole('link', { name: 'Usuários' }).closest('ul')!)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
    expect(itens.indexOf('Tabelas Comuns')).toBe(itens.indexOf('Empresas') + 1)

    await userEvent.click(screen.getByRole('button', { name: 'Tabelas Comuns' }))
    await userEvent.click(await screen.findByRole('link', { name: 'Cidades' }))

    expect(await screen.findByRole('heading', { name: 'Cidades' })).toBeInTheDocument()
    const trilha = screen.getByRole('navigation', { name: 'breadcrumb' })
    expect(within(trilha).getByRole('link', { name: 'Tabelas Comuns' })).toHaveAttribute(
      'href',
      // O submenu leva à primeira tela dele.
      '/administracao/tabelas-comuns/cidades',
    )
  })

  it('lista a tela de Vendas em Lançamentos', async () => {
    await entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Lançamentos' }))

    expect(await screen.findByRole('link', { name: 'Vendas' })).toHaveAttribute(
      'href',
      '/lancamentos/vendas',
    )
  })

  it('lista o relatório de vendas em Relatórios', async () => {
    await entrarLogado()

    await userEvent.click(await screen.findByRole('button', { name: 'Relatórios' }))

    expect(
      await screen.findByRole('link', { name: 'Relatório de Vendas no Período' }),
    ).toHaveAttribute('href', '/relatorios/vendas_periodo')
  })

  it('ajusta a largura do menu pela borda e lembra a escolha', async () => {
    await entrarLogado()

    const alca = await screen.findByRole('separator', { name: 'Largura do menu' })
    const wrapper = document.querySelector<HTMLElement>('[data-slot="sidebar-wrapper"]')!
    expect(wrapper.style.getPropertyValue('--sidebar-width')).toBe('256px')

    alca.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}')

    expect(wrapper.style.getPropertyValue('--sidebar-width')).toBe('288px')
    expect(alca).toHaveAttribute('aria-valuenow', '288')
    expect(localStorage.getItem('erp_estudos.menu.largura')).toBe('288')
  })

  it('mostra o seletor de tema no topo, fora do menu do usuário', async () => {
    await entrarLogado()

    expect(
      await screen.findByRole('button', { name: 'Mudar para o tema escuro' }),
    ).toBeInTheDocument()

    await abrirMenu('Menu do usuário')
    expect(await screen.findByRole('menuitem', { name: 'Sair' })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /Tema/ })).not.toBeInTheDocument()
  })

  it('lista as prefeituras do usuário no seletor', async () => {
    await entrarLogado()

    await abrirMenu(/Demo/)

    expect(await screen.findByRole('menuitem', { name: /Prefeitura Teste/ })).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: /Demo/ })).toBeInTheDocument()
  })
})

describe('grupos de acesso', () => {
  async function entrarComo(me: typeof usuario, rota = '/') {
    setToken('tok-123')
    mockGet({ '/tenant': { id: 'demo', nome: 'Demo' }, '/me': me })
    await renderizar(App, rota)
  }

  it('o menu mostra só os módulos dos grupos do usuário', async () => {
    await entrarComo(usuarioDeCadastros)

    expect(await screen.findByRole('button', { name: 'Cadastros' })).toBeInTheDocument()
    for (const modulo of ['Lançamentos', 'Relatórios', 'Administração']) {
      expect(sidebar().queryByRole('button', { name: modulo })).not.toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: /^Cadastros/ })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /^Lançamentos/ })).not.toBeInTheDocument()
  })

  it('tela sem permissão mostra "Sem acesso"', async () => {
    await entrarComo(usuarioDeCadastros, '/lancamentos/vendas')

    expect(await screen.findByText('Sem acesso')).toBeInTheDocument()
    expect(screen.queryByText('Esta tela ainda está em construção.')).not.toBeInTheDocument()
  })

  it('só o superadmin vê Empresas e Tabelas Comuns', async () => {
    await entrarComo({ ...usuario, superadmin: false, permissoes: ['administracao.usuarios'] })

    await userEvent.click(await screen.findByRole('button', { name: 'Administração' }))

    expect(await screen.findByRole('link', { name: 'Usuários' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Empresas' })).not.toBeInTheDocument()
    expect(sidebar().queryByRole('button', { name: 'Tabelas Comuns' })).not.toBeInTheDocument()
  })
})

describe('empresas', () => {
  const empresas = [
    {
      id: 'demo',
      nome: 'Demo',
      cnpj: null,
      dominio: 'demo.localhost',
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

  async function abrirEmpresas() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/empresas': { data: empresas },
    })
    await renderizar(App, '/administracao/empresas')
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

  it('Nova empresa volta ao tamanho guardado também ao reabrir', async () => {
    localStorage.setItem(
      'erp_estudos.dialogo.empresa',
      JSON.stringify({ largura: 820, altura: 600 }),
    )
    try {
      await abrirEmpresas()

      await userEvent.click(await screen.findByRole('button', { name: 'Nova empresa' }))
      expect((await screen.findByRole('dialog')).style.width).toBe('820px')
      await userEvent.keyboard('{Escape}')
      await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())

      await userEvent.click(screen.getByRole('button', { name: 'Nova empresa' }))
      const reaberto = await screen.findByRole('dialog')
      expect(reaberto.style.width).toBe('820px')
      expect(reaberto.style.height).toBe('600px')
    } finally {
      localStorage.removeItem('erp_estudos.dialogo.empresa')
    }
  })

  it('lista as empresas com CNPJ, endereço e situação', async () => {
    await abrirEmpresas()

    const linha = (await screen.findByText('Prefeitura de Nova Esperança')).closest('tr')!
    expect(linha).toHaveTextContent('11.222.333/0001-81')
    expect(linha).toHaveTextContent('nova-esperanca.localhost')
    expect(linha).toHaveTextContent('Provisionando')
    expect(within(screen.getByRole('table')).getByText('Demo').closest('tr')).toHaveTextContent(
      'Ativa',
    )
  })

  it('cadastra uma empresa com o CNPJ sem máscara', async () => {
    await abrirEmpresas()
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: empresas[1] })

    const dialogo = await preencher(
      'Prefeitura de Nova Esperança',
      '11222333000181',
      'nova-esperanca',
    )
    expect(within(dialogo).getByLabelText('CNPJ')).toHaveValue('11.222.333/0001-81')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    await esperarChamada(post, '/empresas', {
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
    await abrirEmpresas()
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
    await abrirEmpresas()
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { subdominio: ['Este endereço já está em uso.'] } }),
    )

    const dialogo = await preencher('Demo 2', '11222333000181', 'demo')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(await within(dialogo).findByText('Este endereço já está em uso.')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })
})

const gruposMock = [
  { id: 1, nome: 'Lançamentos', telas: ['lancamentos.vendas'], usuarios: 0, sistema: false },
  { id: 2, nome: 'cadastros', telas: ['cadastros.clientes'], usuarios: 1, sistema: false },
  {
    id: 3,
    nome: 'Vendas e relatórios',
    telas: ['lancamentos.vendas', 'relatorios.vendas_periodo'],
    usuarios: 2,
    sistema: false,
  },
  { id: 4, nome: 'Administrador', telas: ['cadastros.clientes'], usuarios: 1, sistema: true },
]

describe('usuarios', () => {
  const usuarios = [
    {
      id: 1,
      name: 'Fiscal Teste',
      cpf: '52998224725',
      email: 'fiscal@erp-estudos.localhost',
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
      grupos: ['Vendas e relatórios'],
      somente_grupos: false,
    },
  ]

  async function abrirUsuarios() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/usuarios': { data: usuarios },
      '/grupos': { data: gruposMock },
    })
    await renderizar(App, '/administracao/usuarios')
  }

  it('lista os usuários com CPF e grupos', async () => {
    await abrirUsuarios()

    const linha = (await screen.findByText('Maria Souza')).closest('tr')!
    expect(linha).toHaveTextContent('111.444.777-35')
    expect(linha).toHaveTextContent('maria@exemplo.com')
    expect(linha).toHaveTextContent('Vendas e relatórios')
    expect(
      within(screen.getByRole('table')).getByText('Fiscal Teste').closest('tr'),
    ).toHaveTextContent('Superadmin')
  })

  it('a busca rápida filtra as linhas da listagem', async () => {
    await abrirUsuarios()

    expect(await screen.findByRole('cell', { name: /Maria Souza/ })).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Busca rápida'), 'maria')

    expect(screen.getByRole('cell', { name: /Maria Souza/ })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: /Fiscal Teste/ })).not.toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Busca rápida'))
    await userEvent.type(screen.getByLabelText('Busca rápida'), 'ninguém')

    expect(await screen.findByText('Nada encontrado')).toBeInTheDocument()
  })

  it('esconde uma coluna pelo menu Colunas e lembra a escolha', async () => {
    await abrirUsuarios()

    expect(await screen.findByRole('columnheader', { name: 'CPF' })).toBeInTheDocument()

    await abrirMenu('Colunas')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'CPF' }))

    expect(screen.queryByRole('columnheader', { name: 'CPF' })).not.toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('erp_estudos.colunas.usuarios')!)).toEqual(['cpf'])
    // Ações não pode ser escondida.
    expect(screen.queryByRole('menuitemcheckbox', { name: 'Ações' })).not.toBeInTheDocument()
  })

  it('filtra por situação pelo menu Filtros', async () => {
    await abrirUsuarios()
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
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/usuarios': { data: muitos },
      '/grupos': { data: gruposMock },
    })
    await renderizar(App, '/administracao/usuarios')

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
    await abrirUsuarios()

    expect(await screen.findByText('2 registros')).toBeInTheDocument()

    await userEvent.type(screen.getByLabelText('Busca rápida'), 'maria')

    expect(await screen.findByText('1 registro')).toBeInTheDocument()
    expect(screen.getByText('Página 1 de 1')).toBeInTheDocument()
  })

  it('não deixa remover o próprio acesso', async () => {
    await abrirUsuarios()

    expect(await screen.findByRole('button', { name: 'Remover Fiscal Teste' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Remover Maria Souza' })).toBeEnabled()
  })

  it('cadastra um usuário com grupo, enviando o CPF sem máscara', async () => {
    await abrirUsuarios()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { ...usuarios[1], vinculado: false },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Novo usuário' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Maria Souza')
    await userEvent.type(within(dialogo).getByLabelText('CPF'), '52998224725')
    await userEvent.type(within(dialogo).getByLabelText('E-mail'), 'maria@exemplo.com')
    await userEvent.type(within(dialogo).getByLabelText('Senha'), 'segredo-forte')
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: 'Vendas e relatórios' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    await esperarChamada(post, '/usuarios', {
      name: 'Maria Souza',
      email: 'maria@exemplo.com',
      password: 'segredo-forte',
      cpf: '52998224725',
      grupos: ['Vendas e relatórios'],
    })
  })

  it('na alteração não pede CPF nem grupos, e a senha é opcional', async () => {
    await abrirUsuarios()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: usuarios[1] })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar Maria Souza' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).queryByLabelText('CPF')).not.toBeInTheDocument()
    expect(within(dialogo).queryByRole('checkbox')).not.toBeInTheDocument()
    await userEvent.type(within(dialogo).getByLabelText('Nome'), ' Lima')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await esperarChamada(put, '/usuarios/2', {
      name: 'Maria Souza Lima',
      email: 'maria@exemplo.com',
    })
  })

  it('edita os vínculos do usuário em um diálogo próprio', async () => {
    await abrirUsuarios()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: usuarios[1] })

    await userEvent.click(
      await screen.findByRole('button', { name: 'Editar vínculos de Maria Souza' }),
    )
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByRole('checkbox', { name: /Vendas e relatórios/ })).toBeChecked()

    await userEvent.click(within(dialogo).getByRole('checkbox', { name: /cadastros/ }))
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: /Vendas e relatórios/ }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await esperarChamada(put, '/usuarios/2/vinculos', { grupos: ['cadastros'] })
  })

  it('desativa o acesso depois de confirmar e reativa direto', async () => {
    await abrirUsuarios()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { ...usuarios[1], ativo: false } })

    await userEvent.click(await screen.findByRole('button', { name: 'Desativar Maria Souza' }))
    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('deixa de entrar nesta prefeitura')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Desativar acesso' }))

    await esperarChamada(put, '/usuarios/2/status', { ativo: false })
  })

  it('mostra quem está inativo e ativa sem confirmação', async () => {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/usuarios': { data: [usuarios[0], { ...usuarios[1], ativo: false }] },
      '/grupos': { data: gruposMock },
    })
    await renderizar(App, '/administracao/usuarios')
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: usuarios[1] })

    const linha = (await screen.findByText('Maria Souza')).closest('tr')!
    expect(linha).toHaveTextContent('Inativo')

    await userEvent.click(within(linha).getByRole('button', { name: 'Ativar Maria Souza' }))

    await esperarChamada(put, '/usuarios/2/status', { ativo: true })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('não deixa desativar o próprio acesso', async () => {
    await abrirUsuarios()

    expect(await screen.findByRole('button', { name: 'Desativar Fiscal Teste' })).toBeDisabled()
  })

  it('remove o acesso depois de confirmar', async () => {
    await abrirUsuarios()
    const remover = vi.spyOn(api, 'delete').mockResolvedValue({ data: null })

    await userEvent.click(await screen.findByRole('button', { name: 'Remover Maria Souza' }))
    const dialogo = await screen.findByRole('dialog')
    expect(dialogo).toHaveTextContent('perde o acesso a esta prefeitura')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Remover acesso' }))

    await esperarChamada(remover, '/usuarios/2')
  })
})

describe('grupos de acesso', () => {
  async function abrirGrupos() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/grupos': { data: gruposMock },
    })
    await renderizar(App, '/administracao/grupos')
  }

  it('lista os grupos com a quantidade de telas e de usuários', async () => {
    await abrirGrupos()

    const linha = (await screen.findByRole('cell', { name: 'Vendas e relatórios' })).closest('tr')!
    // 2 telas e 2 usuários
    expect(within(linha).getAllByText('2')).toHaveLength(2)
    expect(screen.getByRole('cell', { name: 'Lançamentos' }).closest('tr')).toHaveTextContent('1')
  })

  it('cadastra um grupo com telas de módulos diferentes', async () => {
    await abrirGrupos()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { id: 5, nome: 'Balcão', telas: ['cadastros.clientes'], usuarios: 0 },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Novo grupo' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Balcão')
    const cadastros = within(within(dialogo).getByRole('group', { name: 'Cadastros' }))
    const lancamentos = within(within(dialogo).getByRole('group', { name: 'Lançamentos' }))
    await userEvent.click(cadastros.getByRole('checkbox', { name: 'Clientes' }))
    await userEvent.click(lancamentos.getByRole('checkbox', { name: 'Vendas' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    await esperarChamada(post, '/grupos', {
      nome: 'Balcão',
      telas: ['cadastros.clientes', 'lancamentos.vendas'],
    })
  })

  it('marca e desmarca todas as telas de um módulo', async () => {
    await abrirGrupos()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { id: 4, nome: 'Só relatórios', telas: [], usuarios: 0 },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Novo grupo' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.type(within(dialogo).getByLabelText('Nome'), 'Só administração')
    const administracao = within(dialogo).getByRole('group', { name: 'Administração' })
    await userEvent.click(within(administracao).getByRole('button', { name: 'Marcar todas' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    await esperarChamada(post, '/grupos', {
      nome: 'Só administração',
      telas: ['administracao.usuarios', 'administracao.grupos'],
    })
  })

  it('não oferece Empresas nem Tabelas Comuns, que são só do superadmin', async () => {
    await abrirGrupos()

    await userEvent.click(await screen.findByRole('button', { name: 'Novo grupo' }))
    const dialogo = await screen.findByRole('dialog')

    const administracao = within(within(dialogo).getByRole('group', { name: 'Administração' }))
    expect(administracao.getByRole('checkbox', { name: 'Usuários' })).toBeInTheDocument()
    expect(administracao.queryByRole('checkbox', { name: 'Empresas' })).not.toBeInTheDocument()
    expect(within(dialogo).queryByRole('checkbox', { name: 'Cidades' })).not.toBeInTheDocument()
    expect(within(dialogo).queryByRole('checkbox', { name: 'Unidades' })).not.toBeInTheDocument()
  })

  it('abre a alteração com as telas do grupo marcadas', async () => {
    await abrirGrupos()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: gruposMock[2] })

    await userEvent.click(
      await screen.findByRole('button', { name: 'Alterar Vendas e relatórios' }),
    )
    const dialogo = await screen.findByRole('dialog')
    const lancamentos = within(within(dialogo).getByRole('group', { name: 'Lançamentos' }))
    const cadastros = within(within(dialogo).getByRole('group', { name: 'Cadastros' }))
    expect(lancamentos.getByRole('checkbox', { name: 'Vendas' })).toBeChecked()
    expect(cadastros.getByRole('checkbox', { name: 'Clientes' })).not.toBeChecked()

    await userEvent.click(lancamentos.getByRole('checkbox', { name: 'Vendas' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await esperarChamada(put, '/grupos/3', {
      nome: 'Vendas e relatórios',
      telas: ['relatorios.vendas_periodo'],
    })
  })

  it('o grupo do sistema não pode ser alterado nem excluído', async () => {
    await abrirGrupos()

    const linha = (await screen.findByRole('cell', { name: /Administrador/ })).closest('tr')!
    expect(linha).toHaveTextContent('Sistema')
    expect(linha).toHaveTextContent('Acesso total')
    expect(within(linha).queryByRole('button', { name: /Alterar/ })).not.toBeInTheDocument()
    expect(within(linha).queryByRole('button', { name: /Excluir/ })).not.toBeInTheDocument()
  })

  it('exclui um grupo depois de confirmar', async () => {
    await abrirGrupos()
    const remover = vi.spyOn(api, 'delete').mockResolvedValue({ data: null })

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Lançamentos' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir' }))

    await esperarChamada(remover, '/grupos/1')
  })
})

describe('administração › tabelas comuns › cidades', () => {
  const cidades = [
    { id: 2, codigo_ibge: '1100015', nome: "Alta Floresta D'Oeste", uf: 'RO' },
    { id: 3, codigo_ibge: '3509502', nome: 'Campinas', uf: 'SP' },
    { id: 1, codigo_ibge: '3550308', nome: 'São Paulo', uf: 'SP' },
  ]

  async function abrirCidades() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/administracao/tabelas-comuns/cidades': { data: cidades },
    })
    await renderizar(App, '/administracao/tabelas-comuns/cidades')
  }

  it('lista as cidades com UF e código do IBGE', async () => {
    await abrirCidades()

    const linha = (await screen.findByRole('cell', { name: 'Campinas' })).closest('tr')!
    expect(linha).toHaveTextContent('SP')
    expect(linha).toHaveTextContent('3509502')
    expect(screen.getByText('3 registros')).toBeInTheDocument()
  })

  it('busca pelo código do IBGE', async () => {
    await abrirCidades()
    await screen.findByRole('cell', { name: 'Campinas' })

    await userEvent.type(screen.getByLabelText('Busca rápida'), '3550308')

    expect(screen.getByRole('cell', { name: 'São Paulo' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Campinas' })).not.toBeInTheDocument()
  })

  it('filtra por UF pelo menu Filtros', async () => {
    await abrirCidades()
    await screen.findByRole('cell', { name: 'Campinas' })

    await abrirMenu('Filtros')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'RO' }))
    // Com o menu aberto, o resto da página fica escondido: fecha antes de conferir.
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('cell', { name: "Alta Floresta D'Oeste" })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'Campinas' })).not.toBeInTheDocument()
  })

  it('cadastra uma cidade escolhendo a UF', async () => {
    await abrirCidades()
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

    await esperarChamada(post, '/administracao/tabelas-comuns/cidades', {
      codigo_ibge: '3304557',
      nome: 'Rio de Janeiro',
      uf: 'RJ',
    })
  })

  it('não cadastra cidade sem UF nem com código IBGE incompleto', async () => {
    await abrirCidades()
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
    await abrirCidades()
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

    await esperarChamada(put, '/administracao/tabelas-comuns/cidades/3', {
      nome: 'Campinas (SP)',
      uf: 'MG',
    })
  })
})

describe('cadastros › clientes', () => {
  const maria = {
    id: 1,
    tipo_pessoa: 'F',
    cpf_cnpj: '52998224725',
    nome: 'Maria Souza',
    nome_fantasia: null,
    rg: '123456789',
    data_nascimento: '1990-05-20',
    endereco: {
      cep: '13010100',
      logradouro: 'Rua Barão de Jaguara',
      numero: '100',
      complemento: null,
      bairro: 'Centro',
      latitude: -22.9056,
      longitude: -47.0608,
      cidade: { id: 2, nome: 'Campinas', uf: 'SP' },
    },
    contato: { email: 'maria@exemplo.com', telefone: null, celular: '11988887777' },
    fiscal: {
      indicador_ie: 9,
      inscricao_estadual: null,
      inscricao_municipal: null,
      consumidor_final: true,
    },
    limite_credito: '1500.50',
    observacoes: null,
    ativo: true,
  }
  const loja = {
    ...maria,
    id: 2,
    tipo_pessoa: 'J',
    cpf_cnpj: '12ABC34501DE35',
    nome: 'Comércio Exemplo Ltda',
    nome_fantasia: 'Loja Exemplo',
    rg: null,
    data_nascimento: null,
    endereco: { ...maria.endereco, cidade: null },
    ativo: false,
  }

  async function abrirClientes() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/cadastros/clientes': { data: [loja, maria] },
      '/cadastros/clientes/cidades': {
        data: [
          { id: 2, codigo_ibge: '3509502', nome: 'Campinas' },
          { id: 1, codigo_ibge: '3550308', nome: 'São Paulo' },
        ],
      },
    })
    await renderizar(App, '/cadastros/clientes')
  }

  /** Resposta do ViaCEP para o `fetch`. */
  function respostaDoViaCep(dados: unknown) {
    return { ok: true, status: 200, json: async () => dados } as Response
  }

  async function novoCliente() {
    await userEvent.click(await screen.findByRole('button', { name: 'Novo cliente' }))
    return await screen.findByRole('dialog')
  }

  /** Preenche os campos obrigatórios de endereço (pelo ViaCEP simulado) e o celular. */
  async function preencherEnderecoECelular(dialogo: HTMLElement) {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respostaDoViaCep({
        logradouro: 'Rua Barão de Jaguara',
        complemento: '',
        bairro: 'Centro',
        uf: 'SP',
        ibge: '3509502',
      }),
    )
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Endereço e contato' }))
    await userEvent.type(await within(dialogo).findByRole('textbox', { name: 'CEP' }), '13010100')
    await vi.waitFor(() =>
      expect(within(dialogo).getByRole('combobox', { name: 'Cidade' })).toHaveTextContent(
        'Campinas',
      ),
    )
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Número' }), '100')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Celular' }), '11988887777')
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Identificação' }))
  }

  it('lista os clientes com documento, cidade e situação', async () => {
    await abrirClientes()

    const linha = (await screen.findByText('Maria Souza')).closest('tr')!
    expect(linha).toHaveTextContent('529.982.247-25')
    expect(linha).toHaveTextContent('Campinas/SP')
    expect(linha).toHaveTextContent('(11) 98888-7777')
    expect(linha).toHaveTextContent('Ativo')

    const empresa = screen.getByText('Comércio Exemplo Ltda').closest('tr')!
    expect(empresa).toHaveTextContent('Loja Exemplo')
    expect(empresa).toHaveTextContent('12.ABC.345/01DE-35')
    expect(empresa).toHaveTextContent('Inativo')
  })

  it('a busca rápida acha pelo CPF sem máscara e pelo nome fantasia', async () => {
    await abrirClientes()
    await screen.findByText('Maria Souza')

    await userEvent.type(screen.getByLabelText('Busca rápida'), '52998224725')
    expect(screen.getByText('Maria Souza')).toBeInTheDocument()
    expect(screen.queryByText('Comércio Exemplo Ltda')).not.toBeInTheDocument()

    await userEvent.clear(screen.getByLabelText('Busca rápida'))
    await userEvent.type(screen.getByLabelText('Busca rápida'), 'loja exemplo')
    expect(screen.getByText('Comércio Exemplo Ltda')).toBeInTheDocument()
    expect(screen.queryByText('Maria Souza')).not.toBeInTheDocument()
  })

  it('filtra por tipo de pessoa', async () => {
    await abrirClientes()
    await screen.findByText('Maria Souza')

    await abrirMenu('Filtros')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Pessoa jurídica' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.getByText('Comércio Exemplo Ltda')).toBeInTheDocument()
    expect(screen.queryByText('Maria Souza')).not.toBeInTheDocument()
  })

  it('cadastra uma pessoa física com endereço, enviando documentos sem máscara', async () => {
    await abrirClientes()
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { ...maria, id: 3 } })
    const dialogo = await novoCliente()

    const cpf = within(dialogo).getByRole('textbox', { name: 'CPF' })
    await userEvent.type(cpf, '52998224725')
    expect(cpf).toHaveValue('529.982.247-25')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Nome' }), 'Maria Souza')
    await preencherEnderecoECelular(dialogo)
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Endereço e contato' }))
    await userEvent.type(
      await within(dialogo).findByLabelText('Localização'),
      '-22.905600, -47.060800',
    )

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    await esperarChamada(
      post,
      '/cadastros/clientes',
      expect.objectContaining({
        tipo_pessoa: 'F',
        cpf_cnpj: '52998224725',
        nome: 'Maria Souza',
        nome_fantasia: null,
        endereco: {
          cep: '13010100',
          logradouro: 'Rua Barão de Jaguara',
          numero: '100',
          complemento: null,
          bairro: 'Centro',
          latitude: -22.9056,
          longitude: -47.0608,
          cidade: 2,
        },
        contato: { email: null, telefone: null, celular: '11988887777' },
        fiscal: {
          indicador_ie: 9,
          inscricao_estadual: null,
          inscricao_municipal: null,
          consumidor_final: true,
        },
        limite_credito: null,
        ativo: true,
      }),
    )
  })

  it('pessoa jurídica pede CNPJ (aceita o alfanumérico), razão social e nome fantasia', async () => {
    await abrirClientes()
    const dialogo = await novoCliente()

    // Pelo teclado, como nos menus: o clique logo na abertura do diálogo às vezes se perde.
    within(dialogo).getByRole('combobox', { name: 'Tipo de pessoa' }).focus()
    await userEvent.keyboard('{Enter}')
    await screen.findByRole('option', { name: 'Pessoa jurídica' })
    await userEvent.keyboard('{ArrowDown}{Enter}')

    const cnpj = await within(dialogo).findByRole('textbox', { name: 'CNPJ' })
    await userEvent.type(cnpj, '12abc34501de35')
    expect(cnpj).toHaveValue('12.ABC.345/01DE-35')
    expect(within(dialogo).getByRole('textbox', { name: 'Razão social' })).toBeInTheDocument()
    expect(within(dialogo).getByLabelText('Nome fantasia')).toBeInTheDocument()
    expect(within(dialogo).queryByLabelText('RG')).not.toBeInTheDocument()
  })

  it('exige a inscrição estadual do contribuinte do ICMS e abre a aba com o erro', async () => {
    await abrirClientes()
    const post = vi.spyOn(api, 'post')
    const dialogo = await novoCliente()
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'CPF' }), '52998224725')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Nome' }), 'Maria Souza')
    await preencherEnderecoECelular(dialogo)

    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Fiscal e comercial' }))
    await userEvent.click(
      await within(dialogo).findByRole('combobox', { name: 'Indicador da inscrição estadual' }),
    )
    await userEvent.click(await screen.findByRole('option', { name: 'Contribuinte do ICMS' }))
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Identificação' }))
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(
      await within(dialogo).findByText('Informe a inscrição estadual do contribuinte.'),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('exige CEP, logradouro, número, bairro, UF, cidade e celular', async () => {
    await abrirClientes()
    const post = vi.spyOn(api, 'post')
    const dialogo = await novoCliente()
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'CPF' }), '52998224725')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Nome' }), 'Maria Souza')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    // O erro está na aba de endereço, que se abre sozinha.
    for (const mensagem of [
      'Informe o CEP.',
      'Informe o logradouro.',
      'Informe o número (ou S/N).',
      'Informe o bairro.',
      'Escolha a UF.',
      'Informe o celular.',
    ]) {
      expect(await within(dialogo).findByText(mensagem)).toBeInTheDocument()
    }
    expect(within(dialogo).queryByText('Informe o telefone com DDD.')).not.toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('marca com asterisco os campos obrigatórios', async () => {
    await abrirClientes()
    const dialogo = await novoCliente()
    const rotulo = (id: string) => dialogo.querySelector(`label[for="${id}"]`)!

    for (const id of ['cliente-tipo', 'cliente-documento', 'cliente-nome']) {
      expect(rotulo(id)).toHaveTextContent('*')
    }
    expect(rotulo('cliente-rg')).not.toHaveTextContent('*')

    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Endereço e contato' }))
    await within(dialogo).findByRole('textbox', { name: 'CEP' })
    for (const id of ['cliente-cep', 'cliente-logradouro', 'cliente-numero', 'cliente-bairro']) {
      expect(rotulo(id)).toHaveTextContent('*')
    }
    for (const id of ['cliente-uf', 'cliente-cidade', 'cliente-celular']) {
      expect(rotulo(id)).toHaveTextContent('*')
    }
    for (const id of ['cliente-complemento', 'cliente-email', 'cliente-telefone']) {
      expect(rotulo(id)).not.toHaveTextContent('*')
    }

    // A inscrição estadual só é obrigatória para contribuinte do ICMS.
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Fiscal e comercial' }))
    await within(dialogo).findByRole('combobox', { name: 'Indicador da inscrição estadual' })
    expect(rotulo('cliente-ie')).not.toHaveTextContent('*')
    await userEvent.click(
      within(dialogo).getByRole('combobox', { name: 'Indicador da inscrição estadual' }),
    )
    await userEvent.click(await screen.findByRole('option', { name: 'Contribuinte do ICMS' }))
    expect(rotulo('cliente-ie')).toHaveTextContent('*')
  })

  it('localização fora do padrão do Google Maps é recusada', async () => {
    await abrirClientes()
    const post = vi.spyOn(api, 'post')
    const dialogo = await novoCliente()
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Endereço e contato' }))
    await userEvent.type(await within(dialogo).findByLabelText('Localização'), '22°54′S 47°03′W')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(
      await within(dialogo).findByText(
        'Use o formato do Google Maps: latitude, longitude (ex.: -22.905600, -47.060800).',
      ),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('na alteração, mostra a localização e o link para o Google Maps', async () => {
    await abrirClientes()

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar Maria Souza' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Endereço e contato' }))

    expect(await within(dialogo).findByLabelText('Localização')).toHaveValue('-22.9056, -47.0608')
    expect(within(dialogo).getByRole('link', { name: 'Ver no Google Maps' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps?q=-22.9056,-47.0608',
    )
  })

  it('celular vem antes do telefone, que fica à direita', async () => {
    await abrirClientes()
    const dialogo = await novoCliente()
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Endereço e contato' }))

    const celular = await within(dialogo).findByRole('textbox', { name: 'Celular' })
    const telefone = within(dialogo).getByLabelText('Telefone')
    expect(
      celular.compareDocumentPosition(telefone) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('mostra no campo o CPF repetido recusado pelo servidor', async () => {
    await abrirClientes()
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { cpf_cnpj: ['Já existe um cliente com este CPF/CNPJ.'] } }),
    )
    const dialogo = await novoCliente()
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'CPF' }), '52998224725')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Nome' }), 'Maria Souza')
    await preencherEnderecoECelular(dialogo)
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(
      await within(dialogo).findByText('Já existe um cliente com este CPF/CNPJ.'),
    ).toBeInTheDocument()
  })

  it('altera um cliente com os dados atuais no formulário', async () => {
    await abrirClientes()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: maria })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar Maria Souza' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByRole('textbox', { name: 'CPF' })).toHaveValue('529.982.247-25')
    const nome = within(dialogo).getByRole('textbox', { name: 'Nome' })
    expect(nome).toHaveValue('Maria Souza')
    await userEvent.clear(nome)
    await userEvent.type(nome, 'Maria Souza Lima')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await esperarChamada(
      put,
      '/cadastros/clientes/1',
      expect.objectContaining({
        nome: 'Maria Souza Lima',
        endereco: expect.objectContaining({ cidade: 2 }),
        limite_credito: 1500.5,
      }),
    )
  })

  it('exclui um cliente depois de confirmar', async () => {
    await abrirClientes()
    const remover = vi.spyOn(api, 'delete').mockResolvedValue({ data: null })

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Maria Souza' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir' }))

    await esperarChamada(remover, '/cadastros/clientes/1')
  })

  it('preenche o endereço pelo CEP com o ViaCEP, achando a cidade pelo código do IBGE', async () => {
    await abrirClientes()
    const consulta = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      respostaDoViaCep({
        cep: '13010-100',
        logradouro: 'Rua Barão de Jaguara',
        complemento: '',
        bairro: 'Centro',
        localidade: 'Campinas',
        uf: 'SP',
        ibge: '3509502',
      }),
    )
    const dialogo = await novoCliente()
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Endereço e contato' }))

    await userEvent.type(await within(dialogo).findByRole('textbox', { name: 'CEP' }), '13010100')

    expect(consulta).toHaveBeenCalledWith('https://viacep.com.br/ws/13010100/json/')
    await vi.waitFor(() =>
      expect(within(dialogo).getByRole('textbox', { name: 'Logradouro' })).toHaveValue(
        'Rua Barão de Jaguara',
      ),
    )
    expect(within(dialogo).getByRole('textbox', { name: 'Bairro' })).toHaveValue('Centro')
    expect(within(dialogo).getByRole('combobox', { name: 'UF' })).toHaveTextContent('SP')
    await vi.waitFor(() =>
      expect(within(dialogo).getByRole('combobox', { name: 'Cidade' })).toHaveTextContent(
        'Campinas',
      ),
    )
    // O token do ERP não vai para o ViaCEP.
    expect(consulta.mock.calls[0]).toHaveLength(1)
  })

  it('avisa no campo quando o CEP não existe', async () => {
    await abrirClientes()
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(respostaDoViaCep({ erro: 'true' }))
    const dialogo = await novoCliente()
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Endereço e contato' }))

    await userEvent.type(await within(dialogo).findByRole('textbox', { name: 'CEP' }), '99999999')

    expect(
      await within(dialogo).findByText(
        'CEP não encontrado. Confira o número ou preencha o endereço.',
      ),
    ).toBeInTheDocument()
    expect(within(dialogo).getByRole('textbox', { name: 'Logradouro' })).toHaveValue('')
  })

  it('abre o formulário no tamanho deixado da última vez', async () => {
    localStorage.setItem(
      'erp_estudos.dialogo.cliente',
      JSON.stringify({ largura: 900, altura: 640 }),
    )
    try {
      await abrirClientes()
      const dialogo = await novoCliente()

      expect(dialogo.style.width).toBe('900px')
      expect(dialogo.style.height).toBe('640px')
    } finally {
      localStorage.removeItem('erp_estudos.dialogo.cliente')
    }
  })
})

describe('cadastros › produtos', () => {
  const cafe = {
    id: 1,
    codigo: 'CAFE-500',
    descricao: 'Café torrado 500 g',
    codigo_barras: '7891000315507',
    unidade: 'UN',
    categoria: 'Alimentos',
    precos: { custo: '12.5000', venda: '18.90', margem: 51.2 },
    estoque: { controla: true, atual: '40.000', minimo: '10.000', abaixo_do_minimo: false },
    fiscal: { ncm: '09012100', cest: null, origem: 0 },
    pesos: { bruto: '0.520', liquido: '0.500' },
    observacoes: null,
    ativo: true,
  }
  const detergente = {
    ...cafe,
    id: 2,
    codigo: 'LIM-0001',
    descricao: 'Detergente 500 ml',
    codigo_barras: '78910003',
    categoria: 'Limpeza',
    precos: { custo: '1.8000', venda: '2.99', margem: 66.11 },
    estoque: { controla: true, atual: '3.000', minimo: '5.000', abaixo_do_minimo: true },
  }
  const instalacao = {
    ...cafe,
    id: 3,
    codigo: 'SRV-1',
    descricao: 'Instalação',
    codigo_barras: null,
    categoria: null,
    precos: { custo: null, venda: '150.00', margem: null },
    estoque: { controla: false, atual: '0.000', minimo: null, abaixo_do_minimo: false },
    ativo: false,
  }

  async function abrirProdutos() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/cadastros/produtos': { data: [cafe, detergente, instalacao] },
      '/cadastros/produtos/opcoes': {
        unidades: [
          { valor: 'KG', descricao: 'Quilograma' },
          { valor: 'UN', descricao: 'Unidade' },
        ],
        origens: [
          { valor: 0, descricao: 'Nacional' },
          { valor: 1, descricao: 'Estrangeira, importação direta' },
        ],
        categorias: ['Alimentos', 'Limpeza'],
      },
    })
    await renderizar(App, '/cadastros/produtos')
  }

  async function novoProduto() {
    await userEvent.click(await screen.findByRole('button', { name: 'Novo produto' }))
    return await screen.findByRole('dialog')
  }

  it('lista os produtos com preço, estoque e situação', async () => {
    await abrirProdutos()

    const linha = (await screen.findByText('Café torrado 500 g')).closest('tr')!
    expect(linha).toHaveTextContent('CAFE-500')
    expect(linha).toHaveTextContent('R$ 18,90')
    expect(linha).toHaveTextContent('40 UN')
    expect(linha).toHaveTextContent('Alimentos')

    expect(screen.getByText('Detergente 500 ml').closest('tr')!).toHaveTextContent('Estoque baixo')
    const servico = screen.getByText('Instalação').closest('tr')!
    expect(servico).toHaveTextContent('Sem controle')
    expect(servico).toHaveTextContent('Inativo')
  })

  it('a busca rápida acha pelo código de barras, mesmo com a coluna oculta', async () => {
    await abrirProdutos()
    await screen.findByText('Café torrado 500 g')

    await userEvent.type(screen.getByLabelText('Busca rápida'), '78910003')

    expect(screen.getByText('Detergente 500 ml')).toBeInTheDocument()
    expect(screen.queryByText('Instalação')).not.toBeInTheDocument()
  })

  it('filtra por categoria e por estoque baixo', async () => {
    await abrirProdutos()
    await screen.findByText('Café torrado 500 g')

    await abrirMenu('Filtros')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Alimentos' }))
    await userEvent.keyboard('{Escape}')
    expect(screen.getByText('Café torrado 500 g')).toBeInTheDocument()
    expect(screen.queryByText('Detergente 500 ml')).not.toBeInTheDocument()

    // Troca o filtro: desmarca a categoria e marca o estoque baixo (o botão mostra o contador).
    await abrirMenu(/^Filtros/)
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Alimentos' }))
    await userEvent.click(
      await screen.findByRole('menuitemcheckbox', { name: 'No mínimo ou abaixo' }),
    )
    await userEvent.keyboard('{Escape}')
    expect(screen.getByText('Detergente 500 ml')).toBeInTheDocument()
    expect(screen.queryByText('Café torrado 500 g')).not.toBeInTheDocument()
  })

  it('cadastra um produto, calculando a margem e enviando números sem máscara', async () => {
    await abrirProdutos()
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { ...cafe, id: 4 } })
    const dialogo = await novoProduto()

    const codigo = within(dialogo).getByRole('textbox', { name: 'Código' })
    await userEvent.type(codigo, 'cafe-500')
    expect(codigo).toHaveValue('CAFE-500')
    await userEvent.type(
      within(dialogo).getByRole('textbox', { name: 'Descrição' }),
      'Café torrado 500 g',
    )
    await userEvent.type(within(dialogo).getByLabelText('Categoria'), 'Alimentos')
    await userEvent.type(within(dialogo).getByLabelText('Código de barras (EAN)'), '7891000315507')

    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Preços e estoque' }))
    await userEvent.type(await within(dialogo).findByLabelText('Preço de custo (R$)'), '12,50')
    await userEvent.type(
      within(dialogo).getByRole('textbox', { name: 'Preço de venda (R$)' }),
      '18,90',
    )
    expect(within(dialogo).getByLabelText('Margem')).toHaveValue('51,2 %')

    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Fiscal e pesos' }))
    const ncm = await within(dialogo).findByLabelText('NCM')
    await userEvent.type(ncm, '09012100')
    expect(ncm).toHaveValue('0901.21.00')

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    await esperarChamada(post, '/cadastros/produtos', {
      codigo: 'CAFE-500',
      descricao: 'Café torrado 500 g',
      codigo_barras: '7891000315507',
      unidade: 'UN',
      categoria: 'Alimentos',
      precos: { custo: 12.5, venda: 18.9 },
      estoque: { controla: true, minimo: null },
      fiscal: { ncm: '09012100', cest: null, origem: 0 },
      pesos: { bruto: null, liquido: null },
      observacoes: null,
      ativo: true,
    })
  })

  it('recusa código de barras com dígito verificador errado', async () => {
    await abrirProdutos()
    const post = vi.spyOn(api, 'post')
    const dialogo = await novoProduto()
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Código' }), 'X1')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Descrição' }), 'Item')
    await userEvent.type(within(dialogo).getByLabelText('Código de barras (EAN)'), '7891000315508')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(
      await within(dialogo).findByText(
        'Código de barras inválido: confira os dígitos (EAN de 8, 12, 13 ou 14 números).',
      ),
    ).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('o estoque atual é só leitura; sem controle, o mínimo também fica bloqueado', async () => {
    await abrirProdutos()

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar Café torrado 500 g' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Preços e estoque' }))

    const atual = await within(dialogo).findByLabelText('Estoque atual')
    expect(atual).toHaveValue('40')
    expect(atual).toBeDisabled()
    expect(within(dialogo).getByText('Atualizado pela entrada de notas.')).toBeInTheDocument()

    const minimo = within(dialogo).getByLabelText('Estoque mínimo')
    expect(minimo).toBeEnabled()
    await userEvent.click(within(dialogo).getByRole('checkbox', { name: /Controla estoque/ }))
    expect(minimo).toBeDisabled()
  })

  it('mostra no campo o código repetido recusado pelo servidor', async () => {
    await abrirProdutos()
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { codigo: ['Já existe um produto com este código.'] } }),
    )
    const dialogo = await novoProduto()
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Código' }), 'CAFE-500')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Descrição' }), 'Café')
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Preços e estoque' }))
    await userEvent.type(
      await within(dialogo).findByRole('textbox', { name: 'Preço de venda (R$)' }),
      '10',
    )
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(
      await within(dialogo).findByText('Já existe um produto com este código.'),
    ).toBeInTheDocument()
  })

  it('altera um produto com os dados atuais no formulário', async () => {
    await abrirProdutos()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: cafe })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar Café torrado 500 g' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByRole('textbox', { name: 'Código' })).toHaveValue('CAFE-500')
    await userEvent.click(within(dialogo).getByRole('tab', { name: 'Preços e estoque' }))
    expect(await within(dialogo).findByLabelText('Preço de custo (R$)')).toHaveValue('12,5')
    const preco = within(dialogo).getByRole('textbox', { name: 'Preço de venda (R$)' })
    await userEvent.clear(preco)
    await userEvent.type(preco, '19,90')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await esperarChamada(
      put,
      '/cadastros/produtos/1',
      expect.objectContaining({
        precos: { custo: 12.5, venda: 19.9 },
        estoque: { controla: true, minimo: 10 },
        fiscal: { ncm: '09012100', cest: null, origem: 0 },
        pesos: { bruto: 0.52, liquido: 0.5 },
      }),
    )
  })

  it('exclui um produto depois de confirmar', async () => {
    await abrirProdutos()
    const remover = vi.spyOn(api, 'delete').mockResolvedValue({ data: null })

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Detergente 500 ml' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir' }))

    await esperarChamada(remover, '/cadastros/produtos/2')
  })

  it('marca com asterisco os campos obrigatórios', async () => {
    await abrirProdutos()
    const dialogo = await novoProduto()
    const rotulo = (id: string) => dialogo.querySelector(`label[for="${id}"]`)!

    for (const id of ['produto-codigo', 'produto-descricao', 'produto-unidade']) {
      expect(rotulo(id)).toHaveTextContent('*')
    }
    for (const id of ['produto-categoria', 'produto-codigo-barras']) {
      expect(rotulo(id)).not.toHaveTextContent('*')
    }
  })
})

describe('administração › tabelas comuns › unidades', () => {
  async function abrirUnidades() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/administracao/tabelas-comuns/unidades': {
        data: [
          { sigla: 'KG', descricao: 'Quilograma' },
          { sigla: 'UN', descricao: 'Unidade' },
        ],
      },
    })
    await renderizar(App, '/administracao/tabelas-comuns/unidades')
  }

  it('fica em Tabelas Comuns e lista sigla e descrição', async () => {
    await abrirUnidades()

    const linha = (await screen.findByRole('cell', { name: 'Quilograma' })).closest('tr')!
    expect(linha).toHaveTextContent('KG')
    expect(screen.getByText('2 registros')).toBeInTheDocument()
    expect(sidebar().getByRole('link', { name: 'Unidades' })).toBeInTheDocument()
  })

  it('cadastra uma unidade com a sigla em maiúscula', async () => {
    await abrirUnidades()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { sigla: 'FD', descricao: 'Fardo' },
    })

    await userEvent.click(await screen.findByRole('button', { name: 'Nova unidade' }))
    const dialogo = await screen.findByRole('dialog')
    const sigla = within(dialogo).getByRole('textbox', { name: 'Sigla' })
    await userEvent.type(sigla, 'fd')
    expect(sigla).toHaveValue('FD')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Descrição' }), 'Fardo')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    await esperarChamada(post, '/administracao/tabelas-comuns/unidades', {
      sigla: 'FD',
      descricao: 'Fardo',
    })
  })

  it('altera só a descrição, com a sigla bloqueada', async () => {
    await abrirUnidades()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { sigla: 'UN', descricao: 'Und.' } })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar Unidade' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByLabelText('Sigla')).toBeDisabled()
    const descricao = within(dialogo).getByRole('textbox', { name: 'Descrição' })
    await userEvent.clear(descricao)
    await userEvent.type(descricao, 'Und.')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await esperarChamada(put, '/administracao/tabelas-comuns/unidades/UN', { descricao: 'Und.' })
  })
})

describe('cadastros › vendedores', () => {
  const joao = {
    id: 1,
    nome: 'João Pereira',
    cpf: '52998224725',
    data_admissao: '2024-03-01',
    contato: { email: 'joao@exemplo.com', celular: '11988887777', telefone: null },
    comercial: { comissao: '3.50', meta_mensal: '50000.00', regiao: 'Zona Sul' },
    observacoes: null,
    ativo: true,
  }
  const ana = {
    ...joao,
    id: 2,
    nome: 'Ana Costa',
    cpf: '11144477735',
    comercial: { comissao: '2.00', meta_mensal: null, regiao: 'Centro' },
    ativo: false,
  }

  async function abrirVendedores() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/cadastros/vendedores': { data: [ana, joao] },
      '/cadastros/vendedores/regioes': { data: ['Centro', 'Zona Sul'] },
    })
    await renderizar(App, '/cadastros/vendedores')
  }

  async function novoVendedor() {
    await userEvent.click(await screen.findByRole('button', { name: 'Novo vendedor' }))
    return await screen.findByRole('dialog')
  }

  it('lista os vendedores com CPF, comissão, meta e situação', async () => {
    await abrirVendedores()

    const linha = (await screen.findByRole('cell', { name: 'João Pereira' })).closest('tr')!
    expect(linha).toHaveTextContent('529.982.247-25')
    expect(linha).toHaveTextContent('(11) 98888-7777')
    expect(linha).toHaveTextContent('Zona Sul')
    expect(linha).toHaveTextContent('3,5%')
    expect(linha).toHaveTextContent('R$ 50.000,00')
    expect(screen.getByRole('cell', { name: 'Ana Costa' }).closest('tr')!).toHaveTextContent(
      'Inativo',
    )
  })

  it('filtra por região', async () => {
    await abrirVendedores()
    await screen.findByRole('cell', { name: 'João Pereira' })

    await abrirMenu('Filtros')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Centro' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('cell', { name: 'Ana Costa' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: 'João Pereira' })).not.toBeInTheDocument()
  })

  it('cadastra um vendedor enviando CPF e celular sem máscara', async () => {
    await abrirVendedores()
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { ...joao, id: 3 } })
    const dialogo = await novoVendedor()

    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Nome' }), 'João Pereira')
    const cpf = within(dialogo).getByRole('textbox', { name: 'CPF' })
    await userEvent.type(cpf, '52998224725')
    expect(cpf).toHaveValue('529.982.247-25')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Celular' }), '11988887777')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Comissão (%)' }), '3,5')
    await userEvent.type(within(dialogo).getByLabelText('Meta mensal (R$)'), '50.000,00')
    await userEvent.type(within(dialogo).getByLabelText('Região'), 'Zona Sul')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    await esperarChamada(post, '/cadastros/vendedores', {
      nome: 'João Pereira',
      cpf: '52998224725',
      data_admissao: null,
      contato: { email: null, celular: '11988887777', telefone: null },
      comercial: { comissao: 3.5, meta_mensal: 50000, regiao: 'Zona Sul' },
      observacoes: null,
      ativo: true,
    })
  })

  it('exige nome, CPF, celular e comissão', async () => {
    await abrirVendedores()
    const post = vi.spyOn(api, 'post')
    const dialogo = await novoVendedor()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    for (const mensagem of [
      'Informe o nome.',
      'Informe um CPF válido.',
      'Informe o celular.',
      'Informe a comissão (0 se não houver).',
    ]) {
      expect(await within(dialogo).findByText(mensagem)).toBeInTheDocument()
    }
    expect(post).not.toHaveBeenCalled()
  })

  it('mostra no campo o CPF repetido recusado pelo servidor', async () => {
    await abrirVendedores()
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { cpf: ['Já existe um vendedor com este CPF.'] } }),
    )
    const dialogo = await novoVendedor()
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Nome' }), 'João')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'CPF' }), '52998224725')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Celular' }), '11988887777')
    await userEvent.type(within(dialogo).getByRole('textbox', { name: 'Comissão (%)' }), '0')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Cadastrar' }))

    expect(
      await within(dialogo).findByText('Já existe um vendedor com este CPF.'),
    ).toBeInTheDocument()
  })

  it('altera um vendedor com os dados atuais no formulário', async () => {
    await abrirVendedores()
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: joao })

    await userEvent.click(await screen.findByRole('button', { name: 'Alterar João Pereira' }))
    const dialogo = await screen.findByRole('dialog')
    expect(within(dialogo).getByRole('textbox', { name: 'CPF' })).toHaveValue('529.982.247-25')
    const comissao = within(dialogo).getByRole('textbox', { name: 'Comissão (%)' })
    expect(comissao).toHaveValue('3,5')
    await userEvent.clear(comissao)
    await userEvent.type(comissao, '4')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Salvar' }))

    await esperarChamada(
      put,
      '/cadastros/vendedores/1',
      expect.objectContaining({
        data_admissao: '2024-03-01',
        comercial: { comissao: 4, meta_mensal: 50000, regiao: 'Zona Sul' },
      }),
    )
  })

  it('exclui um vendedor depois de confirmar', async () => {
    await abrirVendedores()
    const remover = vi.spyOn(api, 'delete').mockResolvedValue({ data: null })

    await userEvent.click(await screen.findByRole('button', { name: 'Excluir Ana Costa' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Excluir' }))

    await esperarChamada(remover, '/cadastros/vendedores/2')
  })
})

describe('recuperação de senha', () => {
  async function abrirLogin(rota = '/login') {
    mockGet({ '/tenant': { id: 'demo', nome: 'Demo' } })
    await renderizar(App, rota)
  }

  it('o login tem o link de recuperação', async () => {
    await abrirLogin()

    await userEvent.click(await screen.findByRole('link', { name: 'Esqueci minha senha' }))

    expect(await screen.findByRole('heading', { name: 'Esqueci minha senha' })).toBeInTheDocument()
  })

  it('pede o link informando o CPF e confirma o envio', async () => {
    await abrirLogin('/esqueci-senha')
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { message: 'Se o CPF estiver cadastrado nesta prefeitura, enviamos um e-mail.' },
    })

    await userEvent.type(await screen.findByLabelText('CPF'), '52998224725')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))

    await esperarChamada(post, '/senha/esqueci', { cpf: '52998224725' })
    expect(await screen.findByRole('heading', { name: 'Confira o seu e-mail' })).toBeInTheDocument()
  })

  it('recusa CPF inválido antes de enviar', async () => {
    await abrirLogin('/esqueci-senha')
    const post = vi.spyOn(api, 'post')

    await userEvent.type(await screen.findByLabelText('CPF'), '11111111111')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar link' }))

    expect(await screen.findByText('Informe um CPF válido.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('redefine a senha com o token do endereço', async () => {
    await abrirLogin('/redefinir-senha?token=tok-abc&cpf=52998224725')
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { message: 'Senha alterada.' } })

    await userEvent.type(await screen.findByLabelText('Nova senha'), 'senha-nova-forte')
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'senha-nova-forte')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }))

    await esperarChamada(post, '/senha/redefinir', {
      cpf: '52998224725',
      token: 'tok-abc',
      password: 'senha-nova-forte',
      password_confirmation: 'senha-nova-forte',
    })
    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('avisa quando as senhas não conferem', async () => {
    await abrirLogin('/redefinir-senha?token=tok-abc&cpf=52998224725')
    const post = vi.spyOn(api, 'post')

    await userEvent.type(await screen.findByLabelText('Nova senha'), 'senha-nova-forte')
    await userEvent.type(screen.getByLabelText('Repita a nova senha'), 'outra-senha')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar senha' }))

    expect(await screen.findByText('As senhas não conferem.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('sem token no endereço, volta para pedir um link', async () => {
    await abrirLogin('/redefinir-senha')

    expect(await screen.findByRole('heading', { name: 'Esqueci minha senha' })).toBeInTheDocument()
  })

  it('mostra o erro do servidor quando o link não vale mais', async () => {
    await abrirLogin('/redefinir-senha?token=velho&cpf=52998224725')
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
  async function entrarLogado() {
    setToken('tok-123')
    mockGet({ '/tenant': { id: 'demo', nome: 'Demo' }, '/me': usuario })
    await renderizar(App)
  }

  async function abrirMinhaConta() {
    await entrarLogado()
    await abrirMenu('Menu do usuário')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Minha conta' }))
    return screen.findByRole('dialog')
  }

  it('o menu do rodapé mostra o CPF, Minha conta e Sair', async () => {
    await entrarLogado()

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

    await esperarChamada(put, '/me', {
      name: 'Fiscal Novo',
      email: 'fiscal@erp-estudos.localhost',
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

    await esperarChamada(put, '/me/senha', {
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

    await esperarChamada(post, '/me/foto', expect.any(FormData))
    expect((post.mock.calls[0][1] as FormData).get('foto')).toBe(imagem)
  })

  it('remove a foto quando já existe uma', async () => {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': { ...usuario, foto: '/api/fotos/abc.png' },
    })
    await renderizar(App)
    const remover = vi.spyOn(api, 'delete').mockResolvedValue({ data: { foto: null } })

    await abrirMenu('Menu do usuário')
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Minha conta' }))
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Remover' }))

    await esperarChamada(remover, '/me/foto')
  })
})

describe('lançamentos › vendas', () => {
  const arroz = {
    id: 1,
    codigo: 'ARZ-5',
    descricao: 'Arroz 5 kg',
    codigo_barras: '7891000315507',
    unidade: 'UN',
    preco_venda: '10.50',
    controla_estoque: true,
    estoque_atual: '10.000',
  }
  const feijao = {
    ...arroz,
    id: 2,
    codigo: 'FEI-1',
    descricao: 'Feijão 1 kg',
    codigo_barras: null,
    estoque_atual: '0.000',
  }
  const instalacao = {
    ...arroz,
    id: 3,
    codigo: 'SRV-1',
    descricao: 'Instalação',
    codigo_barras: null,
    preco_venda: '25.00',
    controla_estoque: false,
    estoque_atual: '0.000',
  }
  const opcoes = {
    formas_de_pagamento: [
      { valor: 'dinheiro', descricao: 'Dinheiro' },
      { valor: 'pix', descricao: 'Pix' },
    ],
    clientes: [{ id: 7, nome: 'Maria Silva', tipo_pessoa: 'F', cpf_cnpj: '52998224725' }],
    vendedores: [{ id: 3, nome: 'João Pereira' }],
    produtos: [arroz, feijao, instalacao],
  }
  const itemDeArroz = {
    id: 1,
    produto: 1,
    codigo: 'ARZ-5',
    descricao: 'Arroz 5 kg',
    unidade: 'UN',
    quantidade: '2.000',
    preco_unitario: '10.50',
    desconto: '0.00',
    total: '21.00',
    baixou_estoque: true,
  }
  const vendaFinalizada = {
    id: 1,
    data: '2026-10-05',
    cliente: { id: 7, nome: 'Maria Silva', tipo_pessoa: 'F', cpf_cnpj: '52998224725' },
    vendedor: { id: 3, nome: 'João Pereira' },
    forma_pagamento: 'pix',
    subtotal: '21.00',
    desconto: '0.00',
    total: '21.00',
    observacoes: null,
    situacao: 'finalizada',
    registrada_em: '2026-10-05T14:30:00-03:00',
    cancelada_em: null,
    itens: [itemDeArroz],
  }
  const vendaCancelada = {
    ...vendaFinalizada,
    id: 2,
    data: '2026-10-04',
    cliente: { id: 8, nome: 'José Souza', tipo_pessoa: 'F', cpf_cnpj: '11144477735' },
    vendedor: { id: 4, nome: 'Ana Costa' },
    forma_pagamento: 'dinheiro',
    subtotal: '25.00',
    total: '25.00',
    situacao: 'cancelada',
    cancelada_em: '2026-10-04T16:00:00-03:00',
    itens: [{ ...itemDeArroz, id: 2, quantidade: '1.000', total: '25.00' }],
  }

  async function abrirVendas() {
    setToken('tok-123')
    mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/lancamentos/vendas': { data: [vendaFinalizada, vendaCancelada] },
      '/lancamentos/vendas/opcoes': opcoes,
    })
    await renderizar(App, '/lancamentos/vendas')
  }

  async function novaVenda() {
    await userEvent.click(await screen.findByRole('button', { name: 'Nova venda' }))
    const dialogo = await screen.findByRole('dialog')
    await within(dialogo).findByRole('combobox', { name: 'Produtos' })
    return dialogo
  }

  /** Cliente e vendedor pela busca, e a forma de pagamento. */
  async function preencherCabecalho(dialogo: HTMLElement, pagamento = 'Pix') {
    await userEvent.type(within(dialogo).getByRole('combobox', { name: 'Cliente' }), 'maria')
    await userEvent.click(await screen.findByRole('option', { name: /Maria Silva/ }))
    await userEvent.type(within(dialogo).getByRole('combobox', { name: 'Vendedor' }), 'joao')
    await userEvent.click(await screen.findByRole('option', { name: 'João Pereira' }))
    await userEvent.click(within(dialogo).getByRole('combobox', { name: 'Forma de pagamento' }))
    await userEvent.click(await screen.findByRole('option', { name: pagamento }))
  }

  async function adicionarProduto(dialogo: HTMLElement, busca: string, nome: RegExp) {
    const campo = within(dialogo).getByRole('combobox', { name: 'Produtos' })
    await userEvent.clear(campo)
    await userEvent.type(campo, busca)
    await userEvent.click(await screen.findByRole('option', { name: nome }))
  }

  it('fica em Lançamentos › Vendas e lista as vendas com total e situação', async () => {
    await abrirVendas()

    expect(await screen.findByRole('heading', { name: 'Vendas' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toHaveTextContent('Lançamentos')
    const linha = (await screen.findByRole('cell', { name: '000001' })).closest('tr')!
    expect(linha).toHaveTextContent('05/10/2026')
    expect(linha).toHaveTextContent('Maria Silva')
    expect(linha).toHaveTextContent('João Pereira')
    expect(linha).toHaveTextContent('Pix')
    expect(linha).toHaveTextContent('R$ 21,00')
    expect(linha).toHaveTextContent('Finalizada')

    const cancelada = screen.getByRole('cell', { name: '000002' }).closest('tr')!
    expect(cancelada).toHaveTextContent('José Souza')
    expect(cancelada).toHaveTextContent('Cancelada')
    expect(
      within(cancelada).getByRole('button', { name: 'Cancelar a venda 000002' }),
    ).toBeDisabled()
    // O total vendido conta só as finalizadas.
    expect(screen.getByTestId('total-vendido')).toHaveTextContent('R$ 21,00')
  })

  it('filtra as canceladas pelo menu Filtros', async () => {
    await abrirVendas()
    await screen.findByRole('cell', { name: '000001' })

    await abrirMenu('Filtros')
    await userEvent.click(await screen.findByRole('menuitemcheckbox', { name: 'Canceladas' }))
    await userEvent.keyboard('{Escape}')

    expect(screen.getByRole('cell', { name: '000002' })).toBeInTheDocument()
    expect(screen.queryByRole('cell', { name: '000001' })).not.toBeInTheDocument()
  })

  it('registra uma venda com cliente, vendedor e itens, calculando o total', async () => {
    await abrirVendas()
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { ...vendaFinalizada, id: 3 } })
    const dialogo = await novaVenda()

    // Cliente e vendedor pela busca de texto (sem acento).
    await preencherCabecalho(dialogo)

    // Pelo código de barras e pela descrição (sem acento).
    await adicionarProduto(dialogo, '789100', /Arroz 5 kg/)
    await adicionarProduto(dialogo, 'instalacao', /Instalação/)
    const quantidade = within(dialogo).getByLabelText('Quantidade de Arroz 5 kg')
    await userEvent.clear(quantidade)
    await userEvent.type(quantidade, '2')
    expect(within(dialogo).getByText('Disponível: 10 UN', { exact: false })).toBeInTheDocument()

    // 2 × 10,50 + 1 × 25,00 = 46,00; com 1,00 de desconto, 45,00.
    expect(within(dialogo).getByTestId('venda-subtotal')).toHaveTextContent('R$ 46,00')
    await userEvent.type(within(dialogo).getByLabelText('Desconto (R$)'), '1,00')
    expect(within(dialogo).getByTestId('venda-total')).toHaveTextContent('R$ 45,00')

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Registrar venda' }))

    await esperarChamada(post, '/lancamentos/vendas', {
      data: hoje(),
      cliente: 7,
      vendedor: 3,
      forma_pagamento: 'pix',
      desconto: 1,
      observacoes: null,
      itens: [
        { produto: 1, quantidade: 2, preco_unitario: 10.5, desconto: 0 },
        { produto: 3, quantidade: 1, preco_unitario: 25, desconto: 0 },
      ],
    })
    await vi.waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('escolher de novo o mesmo produto soma 1 à quantidade', async () => {
    await abrirVendas()
    const dialogo = await novaVenda()

    await adicionarProduto(dialogo, 'arroz', /Arroz 5 kg/)
    await adicionarProduto(dialogo, 'arroz', /Arroz 5 kg/)

    expect(within(dialogo).getAllByLabelText(/^Quantidade de/)).toHaveLength(1)
    expect(within(dialogo).getByLabelText('Quantidade de Arroz 5 kg')).toHaveValue('2')
  })

  it('produto sem estoque aparece bloqueado e não entra na venda', async () => {
    await abrirVendas()
    const dialogo = await novaVenda()

    await userEvent.type(within(dialogo).getByRole('combobox', { name: 'Produtos' }), 'feijao')
    const opcao = await screen.findByRole('option', { name: /Feijão 1 kg/ })
    expect(opcao).toHaveAttribute('data-disabled')
    expect(opcao).toHaveTextContent('Sem estoque')
    await userEvent.click(opcao)

    expect(within(dialogo).queryByLabelText('Quantidade de Feijão 1 kg')).not.toBeInTheDocument()
  })

  it('não deixa vender mais que o estoque nem registrar sem produtos', async () => {
    await abrirVendas()
    const post = vi.spyOn(api, 'post')
    const dialogo = await novaVenda()

    // Cliente, vendedor, pagamento e produtos são obrigatórios.
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Registrar venda' }))
    expect(await within(dialogo).findByText('Inclua ao menos um produto.')).toBeInTheDocument()
    expect(await within(dialogo).findByText('Escolha o cliente.')).toBeInTheDocument()
    expect(await within(dialogo).findByText('Escolha o vendedor.')).toBeInTheDocument()
    expect(await within(dialogo).findByText('Escolha a forma de pagamento.')).toBeInTheDocument()
    await preencherCabecalho(dialogo, 'Dinheiro')

    await adicionarProduto(dialogo, 'arroz', /Arroz 5 kg/)
    const quantidade = within(dialogo).getByLabelText('Quantidade de Arroz 5 kg')
    await userEvent.clear(quantidade)
    await userEvent.type(quantidade, '11')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Registrar venda' }))

    expect(
      await within(dialogo).findByText('Estoque insuficiente: há 10 UN de Arroz 5 kg.'),
    ).toBeInTheDocument()
    expect(within(dialogo).getByLabelText('Quantidade de Arroz 5 kg')).toHaveAttribute(
      'aria-invalid',
      'true',
    )

    // Produto sem controle de estoque não tem limite.
    await userEvent.clear(quantidade)
    await userEvent.type(quantidade, '10')
    await adicionarProduto(dialogo, 'instal', /Instalação/)
    const servico = within(dialogo).getByLabelText('Quantidade de Instalação')
    await userEvent.clear(servico)
    await userEvent.type(servico, '500')
    await vi.waitFor(() =>
      expect(within(dialogo).queryByText(/Estoque insuficiente/)).not.toBeInTheDocument(),
    )
    expect(post).not.toHaveBeenCalledWith('/lancamentos/vendas', expect.anything())
  })

  it('avisa na hora quando o desconto passa do subtotal', async () => {
    await abrirVendas()
    const post = vi.spyOn(api, 'post')
    const dialogo = await novaVenda()
    await preencherCabecalho(dialogo)
    await adicionarProduto(dialogo, 'arroz', /Arroz 5 kg/)

    await userEvent.type(within(dialogo).getByLabelText('Desconto (R$)'), '10,51')

    expect(within(dialogo).getByText('O desconto não pode passar do subtotal.')).toBeInTheDocument()
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Registrar venda' }))
    await vi.waitFor(() =>
      expect(within(dialogo).getByLabelText('Desconto (R$)')).toHaveAttribute(
        'aria-invalid',
        'true',
      ),
    )
    expect(post).not.toHaveBeenCalledWith('/lancamentos/vendas', expect.anything())
  })

  it('mostra na linha do item o estoque recusado pelo servidor', async () => {
    await abrirVendas()
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, {
        message: 'Estoque insuficiente.',
        errors: { 'itens.0.quantidade': ['Estoque insuficiente: há 1 UN de Arroz 5 kg.'] },
      }),
    )
    const dialogo = await novaVenda()
    await preencherCabecalho(dialogo)
    await adicionarProduto(dialogo, 'arroz', /Arroz 5 kg/)

    await userEvent.click(within(dialogo).getByRole('button', { name: 'Registrar venda' }))

    expect(
      await within(dialogo).findByText('Estoque insuficiente: há 1 UN de Arroz 5 kg.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('mostra a venda e a cancela depois de confirmar', async () => {
    await abrirVendas()
    const post = vi.spyOn(api, 'post').mockResolvedValue({
      data: { ...vendaFinalizada, situacao: 'cancelada' },
    })
    await userEvent.click(await screen.findByRole('button', { name: 'Ver a venda 000001' }))

    const detalhes = await screen.findByRole('dialog', { name: /Venda nº 000001/ })
    expect(detalhes).toHaveTextContent('Maria Silva')
    expect(detalhes).toHaveTextContent('2 UN')
    expect(detalhes).toHaveTextContent('R$ 21,00')

    await userEvent.click(within(detalhes).getByRole('button', { name: 'Cancelar venda' }))
    const confirmacao = await screen.findByRole('dialog', { name: 'Cancelar venda' })
    expect(confirmacao).toHaveTextContent('os produtos voltam ao estoque')
    await userEvent.click(within(confirmacao).getByRole('button', { name: 'Cancelar venda' }))

    await esperarChamada(post, '/lancamentos/vendas/1/cancelar')
  })
})

describe('relatórios › vendas no período', () => {
  const relatorio = {
    filtros: {
      inicio: '2026-09-01',
      fim: '2026-09-30',
      vendedor: null,
      cliente: null,
      forma_pagamento: null,
      incluir_canceladas: false,
    },
    resumo: {
      quantidade: 3,
      subtotal: '350.00',
      descontos: '20.00',
      total: '330.00',
      ticket_medio: '110.00',
      canceladas: { quantidade: 1, total: '70.00' },
    },
    por_pagamento: [
      { forma_pagamento: 'dinheiro', descricao: 'Dinheiro', quantidade: 1, total: '180.00' },
      { forma_pagamento: 'pix', descricao: 'Pix', quantidade: 2, total: '150.00' },
    ],
    por_vendedor: [
      {
        id: 3,
        nome: 'Ana Lima',
        quantidade: 2,
        total: '280.00',
        comissao_percentual: '5.00',
        comissao: '14.00',
      },
    ],
    vendas: [
      {
        id: 12,
        data: '2026-09-10',
        cliente: { id: 7, nome: 'Maria Silva', tipo_pessoa: 'F', cpf_cnpj: '52998224725' },
        vendedor: { id: 3, nome: 'Ana Lima' },
        forma_pagamento: 'dinheiro',
        itens: 2,
        subtotal: '200.00',
        desconto: '20.00',
        total: '180.00',
        situacao: 'finalizada',
      },
    ],
  }
  const opcoes = {
    formas_de_pagamento: [
      { valor: 'dinheiro', descricao: 'Dinheiro' },
      { valor: 'pix', descricao: 'Pix' },
    ],
    clientes: [{ id: 7, nome: 'Maria Silva', tipo_pessoa: 'F', cpf_cnpj: '52998224725' }],
    vendedores: [
      { id: 3, nome: 'Ana Lima' },
      { id: 4, nome: 'Beto Souza' },
    ],
  }

  async function abrirRelatorio(pdf: unknown = new Blob(['%PDF-'], { type: 'application/pdf' })) {
    setToken('tok-123')
    const get = mockGet({
      '/tenant': { id: 'demo', nome: 'Demo' },
      '/me': usuario,
      '/relatorios/vendas-periodo/opcoes': opcoes,
      '/relatorios/vendas-periodo': relatorio,
      '/relatorios/vendas-periodo/pdf': pdf,
    })
    await renderizar(App, '/relatorios/vendas_periodo')
    await screen.findByRole('heading', { name: 'Vendas no período' })
    return get
  }

  async function escolherPeriodo(inicio: string, fim: string) {
    const campoInicio = screen.getByLabelText(/^Data inicial/)
    await userEvent.clear(campoInicio)
    await userEvent.type(campoInicio, inicio)
    const campoFim = screen.getByLabelText(/^Data final/)
    await userEvent.clear(campoFim)
    await userEvent.type(campoFim, fim)
  }

  it('abre pelo menu com o mês corrente e espera o Gerar', async () => {
    const get = await abrirRelatorio()

    expect(screen.getByRole('navigation', { name: 'breadcrumb' })).toHaveTextContent('Relatórios')
    expect(screen.getByLabelText(/^Data inicial/)).toHaveValue(`${hoje().slice(0, 8)}01`)
    expect(screen.getByLabelText(/^Data final/)).toHaveValue(hoje())
    expect(screen.getByText(/clique em/)).toBeInTheDocument()
    expect(get).not.toHaveBeenCalledWith('/relatorios/vendas-periodo', expect.anything())
  })

  it('não gera com a data final antes da inicial', async () => {
    const get = await abrirRelatorio()
    await escolherPeriodo('2026-09-30', '2026-09-01')

    await userEvent.click(screen.getByRole('button', { name: 'Gerar' }))

    expect(
      await screen.findByText('A data final não pode ser antes da inicial.'),
    ).toBeInTheDocument()
    expect(get).not.toHaveBeenCalledWith('/relatorios/vendas-periodo', expect.anything())
  })

  it('gera o relatório com os filtros e mostra totais, resumos e vendas', async () => {
    const get = await abrirRelatorio()
    await escolherPeriodo('2026-09-01', '2026-09-30')
    await userEvent.type(screen.getByRole('combobox', { name: 'Vendedor' }), 'ana')
    await userEvent.click(await screen.findByRole('option', { name: 'Ana Lima' }))
    await userEvent.click(screen.getByRole('combobox', { name: 'Pagamento' }))
    await userEvent.click(await screen.findByRole('option', { name: 'Dinheiro' }))
    await userEvent.click(screen.getByRole('checkbox'))

    await userEvent.click(screen.getByRole('button', { name: 'Gerar' }))

    await esperarChamada(get, '/relatorios/vendas-periodo', {
      params: {
        inicio: '2026-09-01',
        fim: '2026-09-30',
        vendedor: 3,
        forma_pagamento: 'dinheiro',
        incluir_canceladas: 1,
      },
    })
    const resumo = await screen.findByRole('region', { name: 'Resumo' })
    expect(resumo).toHaveTextContent('Total vendido')
    expect(resumo).toHaveTextContent('R$ 330,00')
    expect(resumo).toHaveTextContent('R$ 110,00')
    expect(screen.getByText(/1 venda\(s\) cancelada\(s\)/)).toHaveTextContent('R$ 70,00')
    // O formato de moeda usa espaço não separável: confere pelo texto da linha.
    const pix = within(screen.getByRole('region', { name: 'Por forma de pagamento' }))
      .getByRole('cell', { name: 'Pix' })
      .closest('tr')!
    expect(pix).toHaveTextContent('R$ 150,00')
    const ana = within(screen.getByRole('region', { name: 'Por vendedor' }))
      .getByRole('cell', { name: 'Ana Lima' })
      .closest('tr')!
    expect(ana).toHaveTextContent('R$ 280,00')
    expect(ana).toHaveTextContent('R$ 14,00 (5%)')
    const venda = screen.getByRole('cell', { name: '000012' }).closest('tr')!
    expect(venda).toHaveTextContent('10/09/2026')
    expect(venda).toHaveTextContent('Maria Silva')
    expect(venda).toHaveTextContent('R$ 180,00')
  })

  it('exporta o PDF com os filtros, baixando o arquivo', async () => {
    const get = await abrirRelatorio()
    const criarEndereco = vi.fn(() => 'blob:relatorio')
    vi.stubGlobal(
      'URL',
      Object.assign(URL, { createObjectURL: criarEndereco, revokeObjectURL: vi.fn() }),
    )
    const clique = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    await escolherPeriodo('2026-09-01', '2026-09-30')

    await userEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }))

    await esperarChamada(get, '/relatorios/vendas-periodo/pdf', {
      params: { inicio: '2026-09-01', fim: '2026-09-30', incluir_canceladas: 0 },
      responseType: 'blob',
    })
    await vi.waitFor(() => expect(clique).toHaveBeenCalled())
    expect(criarEndereco).toHaveBeenCalledWith(expect.any(Blob))
    const link = clique.mock.contexts[0] as HTMLAnchorElement
    expect(link.download).toBe('vendas-2026-09-01-a-2026-09-30.pdf')
    expect(link.href).toBe('blob:relatorio')
    vi.unstubAllGlobals()
  })

  it('mostra no campo o erro do PDF recusado pelo servidor', async () => {
    const erro = erroHttp(422, {})
    erro.response!.data = new Blob(
      [
        JSON.stringify({
          message: 'Erro.',
          errors: { fim: ['Data final recusada pelo servidor.'] },
        }),
      ],
      { type: 'application/json' },
    )
    await abrirRelatorio(erro)

    await userEvent.click(screen.getByRole('button', { name: 'Exportar PDF' }))

    expect(await screen.findByText('Data final recusada pelo servidor.')).toBeInTheDocument()
  })
})
