import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowLeft,
  CircleAlert,
  Landmark,
  Lock,
  Receipt,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { SeletorDeTema } from '@/components/seletor-de-tema'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Spinner } from '@/components/ui/spinner'
import { getToken } from '@/lib/api'
import { mensagemDeErroDoLogin, useLogin } from '@/lib/auth'
import { cpfValido, formatarCpf, somenteDigitos } from '@/lib/cpf'
import { nomeExibido, subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'

const esquema = z.object({
  cpf: z.string().refine(cpfValido, 'Informe um CPF válido.'),
  password: z.string().min(1, 'Informe a senha.'),
})

type Campos = z.infer<typeof esquema>

const destaques: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Receipt,
    titulo: 'Lançamentos e DAM',
    texto: 'ISS, IPTU, ITBI, alvará e habite-se lançados com DAM numerado e vencimento à vista.',
  },
  {
    icone: Users,
    titulo: 'Cadastros integrados',
    texto: 'Contribuintes, imóveis e tomadores de serviço consultados no mesmo lugar.',
  },
  {
    icone: Lock,
    titulo: 'Dados da prefeitura protegidos',
    texto: 'Cada prefeitura tem banco próprio, e só entra quem foi autorizado nela.',
  },
]

/** Painel de apresentação à esquerda. Sempre escuro (classe `dark`), nos dois temas. */
function Apresentacao() {
  return (
    <aside className="dark relative hidden overflow-hidden bg-[oklch(0.17_0.05_265)] text-foreground lg:flex">
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(oklch(1_0_0/8%)_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.4_0.15_264/45%),transparent_60%)]"
      />
      <div className="relative flex w-full flex-col justify-between gap-12 p-12">
        <Link to="/" className="flex items-center gap-2.5 font-semibold">
          <span className="flex size-7 items-center justify-center rounded-sm bg-white text-[oklch(0.17_0.05_265)]">
            <Landmark className="size-4" />
          </span>
          STM
        </Link>

        <div className="flex max-w-lg flex-col gap-10">
          <div className="flex flex-col gap-5">
            <h2 className="text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
              Cada tributo lançado. Cada receita no lugar.
            </h2>
            <p className="text-pretty text-muted-foreground">
              O <strong className="font-semibold text-foreground">STM</strong> é o Sistema de
              Tributação Municipal da sua prefeitura: do cadastro do contribuinte à arrecadação, com
              o histórico de tudo.
            </p>
          </div>
          <ul className="flex flex-col gap-6">
            {destaques.map(({ icone: Icone, titulo, texto }) => (
              <li key={titulo} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-white/5">
                  <Icone className="size-4 text-marca" />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-medium">{titulo}</span>
                  <span className="text-sm text-pretty text-muted-foreground">{texto}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-xs text-muted-foreground">STM · Sistema de Tributação Municipal</p>
      </div>
    </aside>
  )
}

/** Moldura das telas de acesso: apresentação à esquerda e o conteúdo à direita. */
export function PaginaDeAcesso({
  titulo,
  descricao,
  children,
}: {
  titulo: string
  descricao: string
  children: ReactNode
}) {
  const prefeitura = usePrefeitura(subdominioDaPrefeitura())

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <Apresentacao />

      <main className="relative flex flex-col bg-muted/40">
        <div
          aria-hidden
          className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px]"
        />
        <div className="relative flex items-center justify-between p-6 lg:justify-end">
          <Link to="/" className="flex items-center gap-2.5 font-semibold lg:hidden">
            <span className="flex size-7 items-center justify-center rounded-sm bg-marca text-marca-foreground">
              <Landmark className="size-4" />
            </span>
            STM
          </Link>
          <SeletorDeTema />
        </div>

        <div className="relative flex flex-1 items-center justify-center px-6 pb-16">
          <div className="flex w-full max-w-sm flex-col gap-8">
            <div className="flex flex-col gap-2">
              {prefeitura.data && (
                <span className="font-mono text-xs tracking-widest text-marca uppercase">
                  {nomeExibido(prefeitura.data)}
                </span>
              )}
              <h1 className="text-2xl font-semibold tracking-tight">{titulo}</h1>
              <p className="text-sm text-muted-foreground">{descricao}</p>
            </div>
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}

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
    <PaginaDeAcesso titulo="Entrar" descricao="Acesse com o CPF cadastrado na sua prefeitura.">
      {login.isError && (
        <Alert variant="destructive">
          <CircleAlert />
          <AlertDescription>{mensagemDeErroDoLogin(login.error)}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={entrar} noValidate className="flex flex-col gap-6">
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
            <FieldError>{errors.cpf?.message}</FieldError>
          </Field>
          <Field data-invalid={errors.password ? true : undefined}>
            <div className="flex items-center justify-between gap-2">
              <FieldLabel htmlFor="password">Senha</FieldLabel>
              <Link
                to="/esqueci-senha"
                className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Esqueci minha senha
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              className="h-10 bg-background"
              aria-invalid={errors.password ? true : undefined}
              {...register('password')}
            />
            <FieldError>{errors.password?.message}</FieldError>
          </Field>
        </FieldGroup>
        <Button
          type="submit"
          size="lg"
          className="w-full bg-marca text-marca-foreground hover:bg-marca/90"
          disabled={login.isPending}
        >
          {login.isPending && <Spinner data-icon="inline-start" />}
          Entrar
        </Button>
      </form>

      <Link
        to="/"
        className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ArrowLeft className="size-3.5" />
        Voltar para a página inicial
      </Link>
    </PaginaDeAcesso>
  )
}
