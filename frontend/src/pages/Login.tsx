import { zodResolver } from '@hookform/resolvers/zod'
import { LoaderCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getToken } from '@/lib/api'
import { mensagemDeErroDoLogin, useLogin } from '@/lib/auth'

const esquema = z.object({
  email: z.email('Informe um e-mail válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

type Campos = z.infer<typeof esquema>

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const login = useLogin()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Campos>({ resolver: zodResolver(esquema) })

  if (getToken() !== null && !login.isSuccess) return <Navigate to="/" replace />

  const destino = (location.state as { de?: string } | null)?.de ?? '/'
  const entrar = handleSubmit((dados) =>
    login.mutate(dados, { onSuccess: () => navigate(destino, { replace: true }) }),
  )

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">STM</CardTitle>
          <CardDescription>Sistema de Tributação Municipal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={entrar} noValidate className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                autoFocus
                aria-invalid={errors.email ? true : undefined}
                {...register('email')}
              />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                aria-invalid={errors.password ? true : undefined}
                {...register('password')}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>
            {login.isError && (
              <p role="alert" className="text-sm text-destructive">
                {mensagemDeErroDoLogin(login.error)}
              </p>
            )}
            <Button type="submit" disabled={login.isPending}>
              {login.isPending && <LoaderCircle className="animate-spin" />}
              Entrar
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
