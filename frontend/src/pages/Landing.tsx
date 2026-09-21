import { zodResolver } from '@hookform/resolvers/zod'
import {
  ArrowRight,
  Building2,
  CircleAlert,
  FileText,
  Globe,
  Landmark,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import { DOMINIO_CENTRAL, enderecoDaPrefeitura } from '@/lib/prefeitura'

const recursos: { icone: LucideIcon; titulo: string; texto: string }[] = [
  {
    icone: Building2,
    titulo: 'Uma base para cada prefeitura',
    texto: 'Os dados de cada município ficam em um banco de dados exclusivo, isolados dos demais.',
  },
  {
    icone: ShieldCheck,
    titulo: 'Acesso controlado',
    texto: 'Cada servidor entra apenas nas prefeituras em que foi autorizado, com login único.',
  },
  {
    icone: FileText,
    titulo: 'Documentos e relatórios',
    texto: 'Geração de documentos e relatórios em PDF, com QR Code para conferência.',
  },
  {
    icone: Globe,
    titulo: 'Direto do navegador',
    texto: 'Sem instalação: cada prefeitura acessa o sistema pelo seu próprio endereço.',
  },
]

const esquema = z.object({
  subdominio: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use apenas letras, números e hífen.'),
})

type Campos = z.infer<typeof esquema>

export default function Landing({ naoEncontrada }: { naoEncontrada?: string }) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Campos>({ resolver: zodResolver(esquema) })

  const acessar = handleSubmit(({ subdominio }) =>
    window.location.assign(enderecoDaPrefeitura(subdominio)),
  )

  return (
    <div className="flex min-h-svh flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <span className="flex items-center gap-2 font-semibold">
          <Landmark />
          STM
        </span>
        <Button asChild variant="outline" size="sm">
          <a href="#acesso">Acessar minha prefeitura</a>
        </Button>
      </header>

      <main className="flex flex-1 flex-col">
        <section className="mx-auto grid w-full max-w-6xl items-center gap-12 px-6 py-16 lg:grid-cols-2">
          <div className="flex flex-col gap-6">
            <Badge variant="secondary">Sistema de Tributação Municipal</Badge>
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
              A gestão tributária da sua prefeitura, em um só lugar
            </h1>
            <p className="text-lg text-pretty text-muted-foreground">
              O STM reúne em uma plataforma segura o trabalho das equipes de tributação dos
              municípios, com os dados de cada prefeitura separados e protegidos.
            </p>
          </div>

          <Card id="acesso" className="scroll-mt-8">
            <CardHeader>
              <CardTitle>Acessar minha prefeitura</CardTitle>
              <CardDescription>
                Informe o endereço da sua prefeitura para ir à tela de login.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-6">
              {naoEncontrada && (
                <Alert variant="destructive">
                  <CircleAlert />
                  <AlertTitle>Prefeitura não encontrada</AlertTitle>
                  <AlertDescription>
                    Não existe prefeitura no endereço “{naoEncontrada}.{DOMINIO_CENTRAL}”. Confira o
                    endereço ou fale com o responsável pelo sistema no seu município.
                  </AlertDescription>
                </Alert>
              )}
              <form id="form-acesso" onSubmit={acessar} noValidate>
                <FieldGroup>
                  <Field data-invalid={errors.subdominio ? true : undefined}>
                    <FieldLabel htmlFor="subdominio">Endereço da prefeitura</FieldLabel>
                    <InputGroup>
                      <InputGroupInput
                        id="subdominio"
                        placeholder="minha-cidade"
                        autoComplete="off"
                        autoCapitalize="none"
                        spellCheck={false}
                        aria-invalid={errors.subdominio ? true : undefined}
                        {...register('subdominio')}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupText>.{DOMINIO_CENTRAL}</InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    {errors.subdominio ? (
                      <FieldError>{errors.subdominio.message}</FieldError>
                    ) : (
                      <FieldDescription>
                        É o início do endereço que você recebeu para acessar o sistema.
                      </FieldDescription>
                    )}
                  </Field>
                </FieldGroup>
              </form>
            </CardContent>
            <CardFooter>
              <Button type="submit" form="form-acesso" className="w-full">
                Continuar
                <ArrowRight data-icon="inline-end" />
              </Button>
            </CardFooter>
          </Card>
        </section>

        <section className="bg-muted/40">
          <div className="mx-auto grid w-full max-w-6xl gap-6 px-6 py-16 sm:grid-cols-2 lg:grid-cols-4">
            {recursos.map(({ icone: Icone, titulo, texto }) => (
              <Card key={titulo}>
                <CardHeader>
                  <Icone />
                  <CardTitle>{titulo}</CardTitle>
                  <CardDescription>{texto}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-6 py-8">
        <Separator />
        <p className="text-sm text-muted-foreground">
          © {new Date().getFullYear()} Lemarq Software · STM — Sistema de Tributação Municipal
        </p>
      </footer>
    </div>
  )
}
