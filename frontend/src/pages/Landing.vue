<script setup lang="ts">
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
  ShieldCheck,
  TrendingUp,
  UserRoundCheck,
} from '@lucide/vue'

import DocumentoIlustrativo from '@/components/landing/DocumentoIlustrativo.vue'
import Rotulo from '@/components/landing/Rotulo.vue'
import Secao, { type Item } from '@/components/landing/Secao.vue'
import SeletorDeTema from '@/components/SeletorDeTema.vue'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { DOMINIO_CENTRAL, nomeDaPrefeitura } from '@/lib/prefeitura'

/**
 * `prefeitura`: id da prefeitura do endereço, quando existe; mostra o botão Painel (login dela).
 * `naoEncontrada`: subdomínio que não corresponde a nenhuma prefeitura.
 */
defineProps<{ prefeitura?: string; naoEncontrada?: string }>()

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

const ano = new Date().getFullYear()
</script>

<template>
  <div class="flex min-h-svh flex-col">
    <header class="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
      <div class="mx-auto flex h-14 w-full max-w-6xl items-center gap-8 px-6">
        <a href="#topo" class="flex items-center gap-2.5">
          <span
            class="flex size-7 items-center justify-center rounded-sm bg-marca text-marca-foreground"
          >
            <Landmark class="size-4" />
          </span>
          <span class="flex flex-col leading-none">
            <span class="text-sm font-semibold">ERP para Estudos</span>
            <span class="font-mono text-[0.6rem] tracking-widest text-muted-foreground uppercase">
              Tributação Municipal
            </span>
          </span>
        </a>
        <nav class="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
          <a
            v-for="secao in secoes"
            :key="secao.id"
            :href="`#${secao.id}`"
            class="transition-colors hover:text-foreground"
          >
            {{ secao.titulo }}
          </a>
        </nav>
        <div class="ml-auto flex items-center gap-2">
          <Button
            v-if="prefeitura"
            as-child
            size="sm"
            class="bg-marca text-marca-foreground hover:bg-marca/90"
          >
            <RouterLink to="/login" :title="`Entrar no painel de ${nomeDaPrefeitura(prefeitura)}`">
              <LogIn data-icon="inline-start" />
              Painel
            </RouterLink>
          </Button>
          <SeletorDeTema />
        </div>
      </div>
    </header>

    <main class="flex flex-1 flex-col">
      <section id="topo" class="relative overflow-hidden">
        <div
          aria-hidden="true"
          class="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px]"
        />
        <div
          aria-hidden="true"
          class="absolute -top-40 left-1/3 size-[40rem] rounded-full bg-marca/10 blur-3xl"
        />
        <div
          class="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-6 py-20 lg:grid-cols-[1.1fr_1fr] lg:py-28"
        >
          <div class="flex flex-col gap-8">
            <Alert v-if="naoEncontrada" variant="destructive">
              <CircleAlert />
              <AlertTitle>Prefeitura não encontrada</AlertTitle>
              <AlertDescription>
                Não existe prefeitura no endereço “{{ naoEncontrada }}.{{ DOMINIO_CENTRAL }}”.
                Confira o endereço ou fale com o responsável pelo sistema no seu município.
              </AlertDescription>
            </Alert>
            <Rotulo>ERP para Estudos</Rotulo>
            <h1
              class="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.5rem] lg:leading-[1.05]"
            >
              Toda a tributação do seu município, do cadastro à arrecadação,
              <span class="text-marca">em um só lugar.</span>
            </h1>
            <p class="max-w-xl text-lg text-pretty text-muted-foreground">
              O ERP para Estudos é um sistema de tributação municipal para prefeituras. Cadastro
              econômico e imobiliário, lançamentos de ISS, IPTU, ITBI e alvará, emissão de DAM e
              relatórios de arrecadação — com os dados de cada prefeitura separados e protegidos.
            </p>
            <div>
              <Button as-child size="lg" class="bg-marca text-marca-foreground hover:bg-marca/90">
                <a href="#como-funciona">
                  Ver como funciona
                  <ArrowRight data-icon="inline-end" />
                </a>
              </Button>
            </div>
            <p class="font-mono text-xs text-muted-foreground">
              Cada prefeitura acessa o sistema no endereço próprio dela — prefeitura.{{
                DOMINIO_CENTRAL
              }}.
            </p>
          </div>
          <DocumentoIlustrativo />
        </div>
      </section>

      <Secao
        id="como-funciona"
        rotulo="Como funciona"
        titulo="Do parâmetro ao relatório, cada etapa da tributação no mesmo sistema."
        :itens="etapas"
        numerada
      />
      <Secao
        id="o-sistema"
        rotulo="O sistema"
        titulo="Feito para várias prefeituras, sem misturar os dados de nenhuma."
        :itens="recursos"
      />
      <Secao
        id="seguranca"
        rotulo="Segurança"
        titulo="Acesso restrito e dados protegidos em cada prefeitura."
        :itens="garantias"
      />
    </main>

    <footer class="border-t">
      <p class="mx-auto w-full max-w-6xl px-6 py-8 font-mono text-xs text-muted-foreground">
        © {{ ano }} ERP para Estudos
      </p>
    </footer>
  </div>
</template>
