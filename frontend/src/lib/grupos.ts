import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import { api } from '@/lib/api'

/** Grupo de acesso da prefeitura: reúne as telas que os usuários dele enxergam. */
export type Grupo = {
  id: number
  nome: string
  /** Permissões das telas (ver `permissaoDaTela`). */
  telas: string[]
  usuarios: number
  /** Grupo do sistema (Administrador): acesso total, não pode ser alterado nem excluído. */
  sistema: boolean
}

export type DadosDoGrupo = {
  nome: string
  telas: string[]
}

export function useGrupos() {
  return useQuery({
    queryKey: ['grupos'],
    queryFn: async () => (await api.get<{ data: Grupo[] }>('/grupos')).data.data,
  })
}

function useInvalidarGrupos() {
  const queryClient = useQueryClient()
  return () => {
    queryClient.invalidateQueries({ queryKey: ['grupos'] })
    // Mudar as telas de um grupo muda o que os usuários dele acessam.
    queryClient.invalidateQueries({ queryKey: ['usuarios'] })
  }
}

export function useCadastrarGrupo() {
  const invalidar = useInvalidarGrupos()
  return useMutation({
    mutationFn: async (grupo: DadosDoGrupo) => (await api.post<Grupo>('/grupos', grupo)).data,
    onSuccess: invalidar,
  })
}

export function useAlterarGrupo(id: number) {
  const invalidar = useInvalidarGrupos()
  return useMutation({
    mutationFn: async (grupo: DadosDoGrupo) => (await api.put<Grupo>(`/grupos/${id}`, grupo)).data,
    onSuccess: invalidar,
  })
}

export function useRemoverGrupo() {
  const invalidar = useInvalidarGrupos()
  return useMutation({
    mutationFn: (id: number) => api.delete(`/grupos/${id}`),
    onSuccess: invalidar,
  })
}
