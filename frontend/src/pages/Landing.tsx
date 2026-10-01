import {
  ArrowRight,
  Building2,
  CircleAlert,
  FileText,
  Globe,
  KeyRound,
  Landmark,
  ListChecks,
  Lock,
  LogIn,
  QrCode,
  Receipt,
  Send,
  ShieldCheck,
  TrendingUp,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'

import { Link } from 'react-router-dom'

import { SeletorDeTema } from '@/components/seletor-de-tema'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DOMINIO_CENTRAL, nomeDaPrefeitura } from '@/lib/prefeitura'

type Item = { icone: LucideIcon; titulo: string; texto: string }

const secoes = [
  { id: 'como-funciona', titulo: 'Como funciona' },
  { id: 'o-sistema', titulo: 'O sistema' },
  { id: 'seguranca', titulo: 'Segurança' },
]

const etapas: Item[] = [
  {
    icone: ListChecks,
    titulo: 'Parâmetros e tabelas',
    texto: 'Receitas, UFM, juros e multa, base legal e tabelas de serviços no padrão do município.',
  },
  {
    icone: Building2,
    titulo: 'Cadastros',
    texto: 'Contribuintes, cadastro econômico, imóveis urbanos e rurais, tomadores de serviço.',
  },
  {
    icone: Receipt,
    titulo: 'Lançamentos',
    texto: 'Nota fiscal, alvará, ITBI, IPTU, habite-se e certidão negativa, com DAM numerado.',
  },
  {
    icone: TrendingUp,
    titulo: 'Arrecadação e relatórios',
    texto: 'Arquivo retorno do banco, receitas apuradas e relações de ISS, INSS e IRPF.',
  },
]

const recursos: Item[] = [
  {
    icone: Building2,
    titulo: 'Uma base para cada prefeitura',
    texto: 'Os dados de cada município ficam em um banco de dados exclusivo, isolados dos demais.',
  },
  {
    icone: UserRoundCheck,
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

const garantias: Item[] = [
  {
    icone: Lock,
    titulo: 'Dados isolados',
    texto: 'Banco de dados próprio por prefeitura: uma nunca enxerga os dados da outra.',
  },
  {
    icone: KeyRound,
    titulo: 'Login por CPF',
    texto: 'Senha guardada com hash e limite de tentativas de acesso por minuto.',
  },
  {
    icone: ShieldCheck,
    titulo: 'Vínculo conferido',
    texto: 'O acesso do servidor à prefeitura é checado no login e em cada operação.',
  },
  {
    icone: QrCode,
    titulo: 'Documentos verificáveis',
    texto: 'Documentos emitidos trazem QR Code para o contribuinte conferir a autenticidade.',
  },
]

function Rotulo({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-xs tracking-[0.2em] text-muted-foreground uppercase">
      <span aria-hidden className="h-px w-6 bg-muted-foreground/60" />
      {children}
    </p>
  )
}

function Secao({
  id,
  rotulo,
  titulo,
  itens,
  numerada,
}: {
  id: string
  rotulo: string
  titulo: string
  itens: Item[]
  numerada?: boolean
}) {
  return (
    <section id={id} className="scroll-mt-16 border-t">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-20">
        <div className="flex max-w-2xl flex-col gap-4">
          <Rotulo>{rotulo}</Rotulo>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">{titulo}</h2>
        </div>
        <ol className="grid gap-px overflow-hidden rounded-xl border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {itens.map(({ icone: Icone, titulo, texto }, i) => (
            <li key={titulo} className="flex flex-col gap-3 bg-background p-6">
              <div className="flex items-center justify-between">
                <Icone className="size-5 text-marca" />
                {numerada && (
                  <span className="font-mono text-xs text-muted-foreground">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                )}
              </div>
              <h3 className="font-medium">{titulo}</h3>
              <p className="text-sm text-pretty text-muted-foreground">{texto}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Ilustração do hero: um DAM emitido, com folhas empilhadas atrás e o carimbo de pago. */
function DocumentoIlustrativo() {
  const campos = [
    ['Contribuinte', 'Padaria Pão Quente Ltda'],
    ['Receita', 'ISSQN — Serviços'],
    ['Vencimento', '10/10/2026'],
    ['Valor', 'R$ 1.284,50'],
  ]

  return (
    <div aria-hidden className="relative mx-auto w-full max-w-md select-none">
      <div className="absolute inset-0 origin-bottom-right -translate-x-4 -translate-y-4 rotate-[-3deg] rounded-xl border bg-muted shadow-sm" />
      <div className="absolute inset-0 origin-bottom-right -translate-x-2 -translate-y-2 rotate-[-1.5deg] rounded-xl border bg-card shadow-sm" />
      <div className="relative flex flex-col gap-6 rounded-xl border bg-card p-6 text-card-foreground shadow-xl">
        <span className="absolute -top-3 -right-3 rotate-[-8deg] rounded-md border-2 border-marca bg-card px-3 py-0.5 font-mono text-xs font-semibold tracking-[0.2em] text-marca uppercase">
          Pago
        </span>
        <div className="flex items-center gap-3 border-b pb-4">
          <span className="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <Landmark className="size-4" />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-medium">Secretaria de Finanças</span>
            <span className="font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
              Tributação
            </span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[0.65rem] tracking-widest text-marca uppercase">
            Documento de Arrecadação Municipal · DAM
          </span>
          <span className="font-mono text-3xl tracking-tight">00347.2026</span>
        </div>
        <dl className="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
          {campos.map(([rotulo, valor]) => (
            <div key={rotulo} className="contents">
              <dt className="text-muted-foreground">{rotulo}</dt>
              <dd className="font-medium">{valor}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-2 border-t pt-4 font-mono text-[0.7rem] text-muted-foreground">
          <span>Lançamento</span>
          <Send className="size-3 text-marca" />
          <span className="text-foreground">Arrecadação</span>
          <span className="h-3 w-px bg-border" />
          <QrCode className="size-3" />
          <span>conferência por QR Code</span>
        </div>
      </div>
    </div>
  )
}

/**
 * `prefeitura`: id da prefeitura do endereço, quando existe; mostra o botão Painel (login dela).
 * `naoEncontrada`: subdomínio que não corresponde a nenhuma prefeitura.
 */
export default function Landing({
  prefeitura,
  naoEncontrada,
}: {
  prefeitura?: string
  naoEncontrada?: string
}) {
  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-6">
          <a href="#topo" className="flex items-center gap-2.5">
            <span className="flex size-7 items-center justify-center rounded-sm bg-marca text-marca-foreground">
              <Landmark className="size-4" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold">STM</span>
              <span className="font-mono text-[0.6rem] tracking-widest text-muted-foreground uppercase">
                Tributação Municipal
              </span>
            </span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {secoes.map(({ id, titulo }) => (
              <a key={id} href={`#${id}`} className="transition-colors hover:text-foreground">
                {titulo}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            {prefeitura && (
              <Button
                asChild
                size="sm"
                className="bg-marca text-marca-foreground hover:bg-marca/90"
              >
                <Link to="/login" title={`Entrar no painel de ${nomeDaPrefeitura(prefeitura)}`}>
                  <LogIn data-icon="inline-start" />
                  Painel
                </Link>
              </Button>
            )}
            <SeletorDeTema />
          </div>
        </div>
      </header>

      <main className="flex flex-1 flex-col">
        <section id="topo" className="relative overflow-hidden">
          <div
            aria-hidden
            className="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px]"
          />
          <div
            aria-hidden
            className="absolute -top-40 left-1/3 size-[40rem] rounded-full bg-marca/10 blur-3xl"
          />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28">
            <div className="flex flex-col gap-8">
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
              <Rotulo>Sistema de Tributação Municipal</Rotulo>
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]">
                Toda a tributação do seu município, do cadastro à arrecadação,{' '}
                <span className="text-marca">em um só lugar.</span>
              </h1>
              <p className="max-w-xl text-lg text-pretty text-muted-foreground">
                O STM é o sistema de tributação municipal para prefeituras. Cadastro econômico e
                imobiliário, lançamentos de ISS, IPTU, ITBI e alvará, emissão de DAM e relatórios de
                arrecadação — com os dados de cada prefeitura separados e protegidos.
              </p>
              <div>
                <Button
                  asChild
                  size="lg"
                  className="bg-marca text-marca-foreground hover:bg-marca/90"
                >
                  <a href="#como-funciona">
                    Ver como funciona
                    <ArrowRight data-icon="inline-end" />
                  </a>
                </Button>
              </div>
              <p className="font-mono text-xs text-muted-foreground">
                Cada prefeitura acessa o sistema no endereço próprio dela — prefeitura.
                {DOMINIO_CENTRAL}.
              </p>
            </div>
            <DocumentoIlustrativo />
          </div>
        </section>

        <Secao
          id="como-funciona"
          rotulo="Como funciona"
          titulo="Do parâmetro ao relatório, cada etapa da tributação no mesmo sistema."
          itens={etapas}
          numerada
        />
        <Secao
          id="o-sistema"
          rotulo="O sistema"
          titulo="Feito para várias prefeituras, sem misturar os dados de nenhuma."
          itens={recursos}
        />
        <Secao
          id="seguranca"
          rotulo="Segurança"
          titulo="Acesso restrito e dados protegidos em cada prefeitura."
          itens={garantias}
        />
      </main>

      <footer className="border-t">
        <p className="mx-auto w-full max-w-6xl px-6 py-8 font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()} STM — Sistema de Tributação Municipal
        </p>
      </footer>
    </div>
  )
}
