import { zodResolver } from '@hookform/resolvers/zod'
import { CircleAlert, MailCheck } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { Link } from 'react-router-dom'
import { z } from 'zod'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'
import { mensagemDeErroDaSenha, usePedirRecuperacao } from '@/lib/senha'
import { PaginaDeAcesso } from '@/pages/Login'

const esquema = z.object({
  cpf: z.string().refine(cpfValido, 'Informe um CPF válido.'),
})

type Campos = z.infer<typeof esquema>

export default function EsqueciSenha() {
  const pedir = usePedirRecuperacao()
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Campos>({ resolver: zodResolver(esquema) })
  const campoCpf = register('cpf')

  const enviar = handleSubmit(({ cpf }) => pedir.mutate(somenteDigitos(cpf)))

  if (pedir.isSuccess) {
    return (
      <PaginaDeAcesso titulo="Confira o seu e-mail" descricao={pedir.data.message}>
        <Alert>
          <MailCheck />
          <AlertDescription>
            O link vale por 60 minutos e só pode ser usado uma vez. Se o e-mail não chegar, confira
            a caixa de spam ou fale com o administrador da sua prefeitura.
          </AlertDescription>
        </Alert>
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">Voltar para o login</Link>
        </Button>
      </PaginaDeAcesso>
    )
  }

  return (
    <PaginaDeAcesso
      titulo="Esqueci minha senha"
      descricao="Informe o CPF do seu acesso. Enviamos um link para o e-mail cadastrado."
    >
      {pedir.isError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{mensagemDeErroDaSenha(pedir.error)}</AlertDescription>
        </Alert>
      )}
      <form onSubmit={enviar} noValidate className="flex flex-col gap-6">
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
              className="h-10 bg-background"
              aria-invalid={errors.cpf ? true : undefined}
              {...campoCpf}
              onChange={(evento) => {
                evento.target.value = formatarCpf(evento.target.value)
                return campoCpf.onChange(evento)
              }}
            />
            {errors.cpf ? (
              <FieldError>{errors.cpf.message}</FieldError>
            ) : (
              <FieldDescription>
                O e-mail é o que está no seu cadastro nesta prefeitura.
              </FieldDescription>
            )}
          </Field>
        </FieldGroup>
        <Button type="submit" size="lg" className="w-full" disabled={pedir.isPending}>
          {pedir.isPending && <Spinner data-icon="inline-start" />}
          Enviar link
        </Button>
      </form>
      <Link
        to="/login"
        className="text-center text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        Voltar para o login
      </Link>
    </PaginaDeAcesso>
  )
}
