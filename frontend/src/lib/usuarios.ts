import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Usuário com acesso à prefeitura atual. */
export type UsuarioDaPrefeitura = {
  id: number
  name: string
  cpf: string | null
  email: string
  foto: string | null
  superadmin: boolean
  /** Acesso ativo nesta prefeitura. Desativado, ele não entra aqui, mas continua nas outras. */
  ativo: boolean
  grupos: string[]
  /** Está em outra prefeitura também: aqui só dá para mudar os grupos. */
  somente_grupos: boolean
}

export type DadosDoUsuario = {
  name: string
  email: string
  password?: string
}

/** No cadastro, o CPF vai sem máscara e os grupos já podem ser escolhidos. */
export type NovoUsuario = DadosDoUsuario & { cpf: string; password: string; grupos: string[] }

export function useUsuariosDaPrefeitura() {
  return useQuery({
    queryKey: ['usuarios'],
    queryFn: async () => (await api.get<{ data: UsuarioDaPrefeitura[] }>('/usuarios')).data.data,
  })
}

function useInvalidarUsuarios() {
  const queryClient = useQueryClient()
  return () => queryClient.invalidateQueries({ queryKey: ['usuarios'] })
}

export function useCadastrarUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation({
    mutationFn: async (usuario: NovoUsuario) =>
      (await api.post<UsuarioDaPrefeitura & { vinculado: boolean }>('/usuarios', usuario)).data,
    onSuccess: invalidar,
  })
}

export function useAlterarUsuario(id: number) {
  const invalidar = useInvalidarUsuarios()
  return useMutation({
    mutationFn: async (usuario: DadosDoUsuario) =>
      (await api.put<UsuarioDaPrefeitura>(`/usuarios/${id}`, usuario)).data,
    onSuccess: invalidar,
  })
}

/** Grupos do usuário nesta prefeitura ("Editar vínculos"). */
export function useAlterarVinculos(id: number) {
  const invalidar = useInvalidarUsuarios()
  return useMutation({
    mutationFn: async (grupos: string[]) =>
      (await api.put<UsuarioDaPrefeitura>(`/usuarios/${id}/vinculos`, { grupos })).data,
    onSuccess: invalidar,
  })
}

/** Ativa ou desativa o acesso do usuário a esta prefeitura. */
export function useAlterarStatus() {
  const invalidar = useInvalidarUsuarios()
  return useMutation({
    mutationFn: async ({ id, ativo }: { id: number; ativo: boolean }) =>
      (await api.put<UsuarioDaPrefeitura>(`/usuarios/${id}/status`, { ativo })).data,
    onSuccess: invalidar,
  })
}

/** Tira o acesso do usuário a esta prefeitura; ele continua no STM. */
export function useRemoverUsuario() {
  const invalidar = useInvalidarUsuarios()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/usuarios/${id}`),
    onSuccess: invalidar,
  })
}
