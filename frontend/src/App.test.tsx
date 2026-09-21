import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import App from '@/App'
import { api } from '@/lib/api'

describe('App', () => {
  it('roda no endereço de um tenant', () => {
    expect(window.location.hostname).toBe('lemarq.localhost')
  })

  it('exibe o tenant retornado pela API', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { id: 'lemarq' } })

    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <App />
        </MemoryRouter>
      </QueryClientProvider>,
    )

    expect(screen.getByRole('heading', { name: 'STM' })).toBeInTheDocument()
    expect(await screen.findByText(/lemarq/)).toBeInTheDocument()
  })
})
