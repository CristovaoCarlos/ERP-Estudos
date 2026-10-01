<script setup lang="ts">
import { Landmark, Lock, Receipt, Users, type LucideIcon } from '@lucide/vue'

import SeletorDeTema from '@/components/SeletorDeTema.vue'
import { nomeExibido, subdominioDaPrefeitura, usePrefeitura } from '@/lib/prefeitura'

/** Moldura das telas de acesso: apresentação à esquerda e o conteúdo à direita. */
defineProps<{ titulo: string; descricao: string }>()

const prefeitura = usePrefeitura(subdominioDaPrefeitura())

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
</script>

<template>
  <div class="grid min-h-svh lg:grid-cols-2">
    <!-- Painel de apresentação. Sempre escuro (classe `dark`), nos dois temas. -->
    <aside
      class="dark relative hidden overflow-hidden bg-[oklch(0.17_0.05_265)] text-foreground lg:flex"
    >
      <div
        aria-hidden="true"
        class="absolute inset-0 bg-[radial-gradient(oklch(1_0_0/8%)_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div
        aria-hidden="true"
        class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,oklch(0.4_0.15_264/45%),transparent_60%)]"
      />
      <div class="relative flex w-full flex-col justify-between gap-12 p-12">
        <RouterLink to="/" class="flex items-center gap-2.5 font-semibold">
          <span
            class="flex size-7 items-center justify-center rounded-sm bg-white text-[oklch(0.17_0.05_265)]"
          >
            <Landmark class="size-4" />
          </span>
          ERP para Estudos
        </RouterLink>

        <div class="flex max-w-lg flex-col gap-10">
          <div class="flex flex-col gap-5">
            <h2 class="text-4xl font-semibold tracking-tight text-balance xl:text-5xl">
              Cada tributo lançado. Cada receita no lugar.
            </h2>
            <p class="text-pretty text-muted-foreground">
              O <strong class="font-semibold text-foreground">ERP para Estudos</strong> é o sistema
              de tributação da sua prefeitura: do cadastro do contribuinte à arrecadação, com o
              histórico de tudo.
            </p>
          </div>
          <ul class="flex flex-col gap-6">
            <li v-for="destaque in destaques" :key="destaque.titulo" class="flex gap-4">
              <span
                class="flex size-8 shrink-0 items-center justify-center rounded-md border bg-white/5"
              >
                <component :is="destaque.icone" class="size-4 text-marca" />
              </span>
              <div class="flex flex-col gap-1">
                <span class="text-sm font-medium">{{ destaque.titulo }}</span>
                <span class="text-sm text-pretty text-muted-foreground">{{ destaque.texto }}</span>
              </div>
            </li>
          </ul>
        </div>

        <p class="text-xs text-muted-foreground">ERP para Estudos</p>
      </div>
    </aside>

    <main class="relative flex flex-col bg-muted/40">
      <div
        aria-hidden="true"
        class="absolute inset-0 bg-[radial-gradient(var(--border)_1px,transparent_1px)] [background-size:22px_22px]"
      />
      <div class="relative flex items-center justify-between p-6 lg:justify-end">
        <RouterLink to="/" class="flex items-center gap-2.5 font-semibold lg:hidden">
          <span
            class="flex size-7 items-center justify-center rounded-sm bg-marca text-marca-foreground"
          >
            <Landmark class="size-4" />
          </span>
          ERP para Estudos
        </RouterLink>
        <SeletorDeTema />
      </div>

      <div class="relative flex flex-1 items-center justify-center px-6 pb-16">
        <div class="flex w-full max-w-sm flex-col gap-8">
          <div class="flex flex-col gap-2">
            <span
              v-if="prefeitura.data.value"
              class="font-mono text-xs tracking-widest text-marca uppercase"
            >
              {{ nomeExibido(prefeitura.data.value) }}
            </span>
            <h1 class="text-2xl font-semibold tracking-tight">{{ titulo }}</h1>
            <p class="text-sm text-muted-foreground">{{ descricao }}</p>
          </div>
          <slot />
        </div>
      </div>
    </main>
  </div>
</template>
