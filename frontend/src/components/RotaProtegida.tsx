import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { getToken } from '@/lib/api'
import { useUsuario } from '@/lib/auth'

export default function RotaProtegida() {
  const location = useLocation()
  const usuario = useUsuario()

  if (getToken() === null || usuario.isError) {
    return <Navigate to="/login" replace state={{ de: location.pathname }} />
  }

  if (usuario.isPending) {
    return <p className="p-8 text-muted-foreground">Carregando…</p>
  }

  return <Outlet />
}
