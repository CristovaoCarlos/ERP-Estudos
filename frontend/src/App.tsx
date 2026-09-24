import type { ComponentType } from 'react'
import { CircleAlert } from 'lucide-react'
import { Route, Routes } from 'react-router-dom'

import AppLayout from '@/components/AppLayout'
import RotaProtegida from '@/components/RotaProtegida'
import Tela from '@/components/Tela'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Spinner } from '@/components/ui/spinner'
import { telas } from '@/lib/navegacao'
import { prefeituraNaoEncontrada, subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'
import Empresas from '@/pages/administracao/Empresas'
import Grupos from '@/pages/administracao/Grupos'
import Bancos from '@/pages/tabelas-comuns/Bancos'
import Cidades from '@/pages/tabelas-comuns/Cidades'
import Cnae from '@/pages/tabelas-comuns/Cnae'
import ListaDeServicos from '@/pages/tabelas-comuns/ListaDeServicos'
import NumeracaoDeNotas from '@/pages/tabelas-comuns/NumeracaoDeNotas'
import Segmentos from '@/pages/tabelas-comuns/Segmentos'
import Selic from '@/pages/tabelas-comuns/Selic'
import TiposDeDam from '@/pages/tabelas-comuns/TiposDeDam'
import Usuarios from '@/pages/administracao/Usuarios'
import EmConstrucao from '@/pages/EmConstrucao'
import ReceitasParametros from '@/pages/parametros/Receitas'
import Inicio from '@/pages/Inicio'
import Landing from '@/pages/Landing'
import EsqueciSenha from '@/pages/EsqueciSenha'
import Login from '@/pages/Login'
import RedefinirSenha from '@/pages/RedefinirSenha'

/** Telas já implementadas; as demais do menu abrem `EmConstrucao`. */
const paginas: Record<string, ComponentType> = {
  '/administracao/empresas': Empresas,
  '/administracao/grupos': Grupos,
  '/tabelas-comuns/bancos': Bancos,
  '/tabelas-comuns/cidades': Cidades,
  '/tabelas-comuns/cnae': Cnae,
  '/tabelas-comuns/lista-de-servicos': ListaDeServicos,
  '/tabelas-comuns/numeracao-de-notas': NumeracaoDeNotas,
  '/tabelas-comuns/segmentos': Segmentos,
  '/tabelas-comuns/selic': Selic,
  '/tabelas-comuns/tipos-de-dam': TiposDeDam,
  '/administracao/usuarios': Usuarios,
  '/parametros/receitas': ReceitasParametros,
}

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
      <Route path="/esqueci-senha" element={<EsqueciSenha />} />
      <Route path="/redefinir-senha" element={<RedefinirSenha />} />
      <Route
        element={<RotaProtegida raizSemSessao={<Landing prefeitura={prefeitura.data.id} />} />}
      >
        <Route element={<AppLayout />}>
          <Route path="/" element={<Inicio />} />
          {telas
            .filter((tela) => tela.url !== '/')
            .map((tela) => {
              const Pagina = paginas[tela.url] ?? EmConstrucao
              return (
                <Route
                  key={tela.url}
                  path={tela.url}
                  element={
                    <Tela url={tela.url}>
                      <Pagina />
                    </Tela>
                  }
                />
              )
            })}
          <Route path="*" element={<EmConstrucao />} />
        </Route>
      </Route>
    </Routes>
  )
}
