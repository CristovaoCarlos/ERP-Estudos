import type { ReactNode } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getToken } from '@/lib/api'
import { useUsuario } from '@/lib/auth'

/** `raizSemSessao`: o que mostrar em `/` para quem não entrou (as outras telas vão para o login). */
export default function RotaProtegida({ raizSemSessao }: { raizSemSessao?: ReactNode }) {
  const location = useLocation()
  const usuario = useUsuario()

  if (getToken() === null && location.pathname === '/' && raizSemSessao) return raizSemSessao

  if (getToken() === null || usuario.isError) {
    return <Navigate to="/login" replace state={{ de: location.pathname }} />
  }

  if (usuario.isPending) {
    return <p className="p-8 text-muted-foreground">Carregando…</p>
  }

  return <Outlet />
}
