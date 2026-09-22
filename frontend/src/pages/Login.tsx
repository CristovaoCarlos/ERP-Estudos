import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { getToken } from '@/lib/api'
import { mensagemDeErroDoLogin, useLogin } from '@/lib/auth'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'

const esquema = z.object({
  cpf: z.string().refine(cpfValido, 'Informe um CPF válido.'),
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
  const entrar = handleSubmit(({ cpf, password }) =>
    login.mutate(
      { cpf: somenteDigitos(cpf), password },
      { onSuccess: () => navigate(destino, { replace: true }) },
    ),
  )
  const campoCpf = register('cpf')

  return (
    <main className="flex min-h-svh items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-xl">STM</CardTitle>
          <CardDescription>Sistema de Tributação Municipal</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-6">
          {login.isError && (
            <Alert variant="destructive">
              <CircleAlert />
              <AlertDescription>{mensagemDeErroDoLogin(login.error)}</AlertDescription>
            </Alert>
          )}
          <form id="form-login" onSubmit={entrar} noValidate>
            <FieldGroup>
              <Field data-invalid={errors.cpf ? true : undefined}>
                <FieldLabel htmlFor="cpf">CPF</FieldLabel>
                <Input
                  id="cpf"
                  inputMode="numeric"
                  autoComplete="username"
                  placeholder="000.000.000-00"
                  maxLength={14}
                  autoFocus
                  aria-invalid={errors.cpf ? true : undefined}
                  {...campoCpf}
                  onChange={(evento) => {
                    evento.target.value = formatarCpf(evento.target.value)
                    return campoCpf.onChange(evento)
                  }}
                />
                <FieldError>{errors.cpf?.message}</FieldError>
              </Field>
              <Field data-invalid={errors.password ? true : undefined}>
                <FieldLabel htmlFor="password">Senha</FieldLabel>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={errors.password ? true : undefined}
                  {...register('password')}
                />
                <FieldError>{errors.password?.message}</FieldError>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
        <CardFooter>
          <Button type="submit" form="form-login" className="w-full" disabled={login.isPending}>
            {login.isPending && <Spinner data-icon="inline-start" />}
            Entrar
          </Button>
        </CardFooter>
      </Card>
    </main>
  )
}
