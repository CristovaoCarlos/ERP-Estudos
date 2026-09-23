import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { formatarCpf } from '@/lib/cpf'
import { mensagemDeErroDaSenha, useRedefinirSenha } from '@/lib/senha'
import { PaginaDeAcesso } from '@/pages/Login'

const SENHA_MINIMA = 8

const esquema = z
  .object({
    password: z.string().min(SENHA_MINIMA, `A senha deve ter ao menos ${SENHA_MINIMA} caracteres.`),
    password_confirmation: z.string(),
  })
  .refine((campos) => campos.password === campos.password_confirmation, {
    path: ['password_confirmation'],
    message: 'As senhas não conferem.',
  })

type Campos = z.infer<typeof esquema>

export default function RedefinirSenha() {
  const [parametros] = useSearchParams()
  const navigate = useNavigate()
  const redefinir = useRedefinirSenha()
  const token = parametros.get('token') ?? ''
  const cpf = parametros.get('cpf') ?? ''
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Campos>({ resolver: zodResolver(esquema) })

  // Sem token no endereço não há o que redefinir.
  if (!token || !cpf) return <Navigate to="/esqueci-senha" replace />

  const salvar = handleSubmit((campos) =>
    redefinir.mutate(
      { ...campos, cpf, token },
      {
        onSuccess: ({ message }) => {
          toast.success(message)
          navigate('/login', { replace: true })
        },
      },
    ),
  )

  return (
    <PaginaDeAcesso
      titulo="Nova senha"
      descricao={`Escolha a nova senha do CPF ${formatarCpf(cpf)}.`}
    >
      {redefinir.isError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{mensagemDeErroDaSenha(redefinir.error)}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={salvar} noValidate className="flex flex-col gap-6">
        <FieldGroup>
          <Field data-invalid={errors.password ? true : undefined}>
            <FieldLabel htmlFor="password">Nova senha</FieldLabel>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              autoFocus
              className="h-10 bg-background"
              aria-invalid={errors.password ? true : undefined}
              {...register('password')}
            />
            {errors.password ? (
              <FieldError>{errors.password.message}</FieldError>
            ) : (
              <FieldDescription>Ao menos {SENHA_MINIMA} caracteres.</FieldDescription>
            )}
          </Field>
          <Field data-invalid={errors.password_confirmation ? true : undefined}>
            <FieldLabel htmlFor="password_confirmation">Repita a nova senha</FieldLabel>
            <Input
              id="password_confirmation"
              type="password"
              autoComplete="new-password"
              className="h-10 bg-background"
              aria-invalid={errors.password_confirmation ? true : undefined}
              {...register('password_confirmation')}
            />
            <FieldError>{errors.password_confirmation?.message}</FieldError>
          </Field>
        </FieldGroup>
        <Button type="submit" size="lg" className="w-full" disabled={redefinir.isPending}>
          {redefinir.isPending && <Spinner data-icon="inline-start" />}
          Salvar senha
        </Button>
      </form>
      <Link
        to="/esqueci-senha"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Pedir um link novo
      </Link>
    </PaginaDeAcesso>
  )
}
