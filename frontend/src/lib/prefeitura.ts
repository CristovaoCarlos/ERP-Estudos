import { useQuery } from '@tanstack/react-query'
import axios from 'axios'

import { api } from '@/lib/api'

export const DOMINIO_CENTRAL: string = import.meta.env.VITE_CENTRAL_DOMAIN ?? 'localhost'

export function subdominioDaPrefeitura(hostname = window.location.hostname): string | null {
  const sufixo = `.${DOMINIO_CENTRAL}`
  return hostname.endsWith(sufixo) ? hostname.slice(0, -sufixo.length) : null
}

export function enderecoDoDominio(dominio: string): string {
  const { protocol, port } = window.location
  return `${protocol}//${dominio}${port ? `:${port}` : ''}/login`
}

export function enderecoDaPrefeitura(subdominio: string): string {
  return enderecoDoDominio(`${subdominio}.${DOMINIO_CENTRAL}`)
}

/** "prefeitura_teste" → "Prefeitura Teste" (as prefeituras ainda não têm nome cadastrado). */
export function nomeDaPrefeitura(id: string): string {
  return id
    .split(/[_-]+/)
    .filter(Boolean)
    .map((parte) => parte[0].toUpperCase() + parte.slice(1))
    .join(' ')
}

export function usePrefeitura(subdominio: string | null) {
  return useQuery({
    queryKey: ['tenant'],
    queryFn: async () => (await api.get<{ id: string }>('/tenant')).data,
    enabled: subdominio !== null,
    retry: false,
    staleTime: Infinity,
  })
}

export function prefeituraNaoEncontrada(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 404
}
