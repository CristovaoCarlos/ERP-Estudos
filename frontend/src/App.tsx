import { CircleAlert } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/AppLayout'
import RotaProtegida from '@/components/RotaProtegida'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { telas } from '@/lib/navegacao'
import { prefeituraNaoEncontrada, subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'
import EmConstrucao from '@/pages/EmConstrucao'
import Inicio from '@/pages/Inicio'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'

export default function App() {
  const subdominio = subdominioDaPrefeitura()
  const prefeitura = usePrefeitura(subdominio)

  if (subdominio === null) return <Landing />

  if (prefeitura.isPending) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (prefeitura.isError) {
    if (prefeituraNaoEncontrada(prefeitura.error)) return <Landing naoEncontrada={subdominio} />

    return (
      <div className="flex min-h-svh items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <CircleAlert />
          <AlertTitle>Não foi possível conectar ao servidor</AlertTitle>
          <AlertDescription>Tente novamente em alguns instantes.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RotaProtegida />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Inicio />} />
          {telas
            .filter((tela) => tela.url !== '/')
            .map((tela) => (
              <Route key={tela.url} path={tela.url} element={<EmConstrucao />} />
            ))}
          <Route path="*" element={<EmConstrucao />} />
        </Route>
      </Route>
    </Routes>
  )
}
