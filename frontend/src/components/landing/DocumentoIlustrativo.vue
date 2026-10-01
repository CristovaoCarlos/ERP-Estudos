<script setup lang="ts">
import { Landmark, QrCode, Send } from '@lucide/vue'

/** Ilustração do hero: um DAM emitido, com folhas empilhadas atrás e o carimbo de pago. */
const campos = [
  ['Contribuinte', 'Padaria Pão Quente Ltda'],
  ['Receita', 'ISSQN — Serviços'],
  ['Vencimento', '10/10/2026'],
  ['Valor', 'R$ 1.284,50'],
]
</script>

<template>
  <div aria-hidden="true" class="relative mx-auto w-full max-w-md select-none">
    <div
      class="absolute inset-0 origin-bottom-right -translate-x-4 -translate-y-4 rotate-[-3deg] rounded-xl border bg-muted shadow-sm"
    />
    <div
      class="absolute inset-0 origin-bottom-right -translate-x-2 -translate-y-2 rotate-[-1.5deg] rounded-xl border bg-card shadow-sm"
    />
    <div
      class="relative flex flex-col gap-6 rounded-xl border bg-card p-6 text-card-foreground shadow-xl"
    >
      <span
        class="absolute -top-3 -right-3 rotate-[-8deg] rounded-md border-2 border-marca bg-card px-3 py-0.5 font-mono text-xs font-semibold tracking-[0.2em] text-marca uppercase"
      >
        Pago
      </span>
      <div class="flex items-center gap-3 border-b pb-4">
        <span
          class="flex size-9 items-center justify-center rounded-md bg-muted text-muted-foreground"
        >
          <Landmark class="size-4" />
        </span>
        <div class="flex flex-col">
          <span class="text-sm font-medium">Secretaria de Finanças</span>
          <span class="font-mono text-[0.65rem] tracking-widest text-muted-foreground uppercase">
            Tributação
          </span>
        </div>
      </div>
      <div class="flex flex-col gap-1">
        <span class="font-mono text-[0.65rem] tracking-widest text-marca uppercase">
          Documento de Arrecadação Municipal · DAM
        </span>
        <span class="font-mono text-3xl tracking-tight">00347.2026</span>
      </div>
      <dl class="grid grid-cols-[auto_1fr] gap-x-8 gap-y-2 text-sm">
        <div v-for="[rotulo, valor] in campos" :key="rotulo" class="contents">
          <dt class="text-muted-foreground">{{ rotulo }}</dt>
          <dd class="font-medium">{{ valor }}</dd>
        </div>
      </dl>
      <div
        class="flex flex-wrap items-center gap-2 border-t pt-4 font-mono text-[0.7rem] text-muted-foreground"
      >
        <span>Lançamento</span>
        <Send class="size-3 text-marca" />
        <span class="text-foreground">Arrecadação</span>
        <span class="h-3 w-px bg-border" />
        <QrCode class="size-3" />
        <span>conferência por QR Code</span>
      </div>
    </div>
  </div>
</template>
