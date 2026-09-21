import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, AxiosHeaders } from 'axios'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { api, getToken, setToken } from '@/lib/api'

const usuario = { id: 1, name: 'Fiscal Teste', email: 'fiscal@stm.localhost' }

function renderizar(rota = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[rota]}>
        <App />
      </MemoryRouter>
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

afterEach(() => {
  vi.restoreAllMocks()
  setToken(null)
})

describe('App', () => {
  it('roda no endereço de um tenant', () => {
    expect(window.location.hostname).toBe('lemarq.localhost')
  })

  it('redireciona para o login quando não há sessão', () => {
    renderizar('/')

    expect(screen.getByRole('button', { name: 'Entrar' })).toBeInTheDocument()
  })

  it('valida os campos antes de enviar', async () => {
    const post = vi.spyOn(api, 'post')
    renderizar('/login')

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Informe um e-mail válido.')).toBeInTheDocument()
    expect(screen.getByText('Informe a senha.')).toBeInTheDocument()
    expect(post).not.toHaveBeenCalled()
  })

  it('faz login, guarda o token e abre a página inicial', async () => {
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: { token: 'tok-123', usuario } })
    vi.spyOn(api, 'get').mockResolvedValue({ data: { id: 'lemarq' } })
    renderizar('/login')

    await userEvent.type(screen.getByLabelText('E-mail'), usuario.email)
    await userEvent.type(screen.getByLabelText('Senha'), 'segredo')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Fiscal Teste')).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/login', { email: usuario.email, password: 'segredo' })
    expect(getToken()).toBe('tok-123')
    expect(await screen.findByText(/lemarq/)).toBeInTheDocument()
  })

  it('mostra a mensagem do servidor quando as credenciais são inválidas', async () => {
    vi.spyOn(api, 'post').mockRejectedValue(
      erroHttp(422, { errors: { email: ['E-mail ou senha inválidos.'] } }),
    )
    renderizar('/login')

    await userEvent.type(screen.getByLabelText('E-mail'), usuario.email)
    await userEvent.type(screen.getByLabelText('Senha'), 'errada')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('E-mail ou senha inválidos.')
    expect(getToken()).toBeNull()
  })

  it('sair revoga a sessão e volta para o login', async () => {
    setToken('tok-123')
    vi.spyOn(api, 'get').mockImplementation(async (url) => ({
      data: url === '/me' ? usuario : { id: 'lemarq' },
    }))
    const post = vi.spyOn(api, 'post').mockResolvedValue({ data: null })
    renderizar('/')

    await userEvent.click(await screen.findByRole('button', { name: 'Sair' }))

    expect(await screen.findByRole('button', { name: 'Entrar' })).toBeInTheDocument()
    expect(post).toHaveBeenCalledWith('/logout')
    expect(getToken()).toBeNull()
  })
})
