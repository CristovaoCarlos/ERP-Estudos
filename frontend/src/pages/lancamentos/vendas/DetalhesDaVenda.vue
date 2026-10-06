<script setup lang="ts">
import ConteudoDoFormulario from '@/components/ConteudoDoFormulario.vue'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { formatarDocumento } from '@/lib/cadastros-clientes'
import {
  FORMAS_DE_PAGAMENTO,
  formatarData,
  formatarDataHora,
  numeroDaVenda,
  type Venda,
} from '@/lib/lancamentos-vendas'
import { formatarMoeda, formatarQuantidade } from '@/lib/numeros'

/** Venda registrada, só para consulta: a venda não se altera, só se cancela. */
defineProps<{ venda: Venda }>()
const emit = defineEmits<{ fechar: []; cancelar: [] }>()
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <ConteudoDoFormulario chave="venda-detalhes" largura="sm:w-3xl">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          Venda nº {{ numeroDaVenda(venda.id) }}
          <Badge v-if="venda.situacao === 'cancelada'" variant="destructive">Cancelada</Badge>
          <Badge v-else variant="secondary">Finalizada</Badge>
        </DialogTitle>
        <DialogDescription>
          Registrada em {{ formatarDataHora(venda.registrada_em) }}
          <template v-if="venda.cancelada_em">
            · cancelada em {{ formatarDataHora(venda.cancelada_em) }} (itens devolvidos ao estoque)
          </template>
        </DialogDescription>
      </DialogHeader>

      <dl class="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
        <div>
          <dt class="text-muted-foreground">Data</dt>
          <dd>{{ formatarData(venda.data) }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Forma de pagamento</dt>
          <dd>{{ FORMAS_DE_PAGAMENTO[venda.forma_pagamento] ?? venda.forma_pagamento }}</dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Cliente</dt>
          <dd>
            {{ venda.cliente.nome }}
            <span class="font-mono text-xs text-muted-foreground">
              {{ formatarDocumento(venda.cliente.tipo_pessoa, venda.cliente.cpf_cnpj) }}
            </span>
          </dd>
        </div>
        <div>
          <dt class="text-muted-foreground">Vendedor</dt>
          <dd>{{ venda.vendedor.nome }}</dd>
        </div>
      </dl>

      <div class="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead class="text-right">Quantidade</TableHead>
              <TableHead class="text-right">Preço unit.</TableHead>
              <TableHead class="text-right">Desconto</TableHead>
              <TableHead class="text-right">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-for="item in venda.itens" :key="item.id">
              <TableCell class="whitespace-normal">
                <div class="flex flex-col">
                  <span class="font-medium">{{ item.descricao }}</span>
                  <span class="font-mono text-xs text-muted-foreground">{{ item.codigo }}</span>
                </div>
              </TableCell>
              <TableCell class="text-right whitespace-nowrap">
                {{ formatarQuantidade(item.quantidade) }} {{ item.unidade }}
              </TableCell>
              <TableCell class="text-right whitespace-nowrap">
                {{ formatarMoeda(item.preco_unitario) }}
              </TableCell>
              <TableCell class="text-right whitespace-nowrap text-muted-foreground">
                {{ Number(item.desconto) ? formatarMoeda(item.desconto) : '—' }}
              </TableCell>
              <TableCell class="text-right font-medium whitespace-nowrap">
                {{ formatarMoeda(item.total) }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div class="grid gap-4 sm:grid-cols-[1fr_16rem]">
        <div class="text-sm">
          <p class="text-muted-foreground">Observações</p>
          <p class="whitespace-pre-line">{{ venda.observacoes ?? '—' }}</p>
        </div>
        <div class="flex flex-col gap-2 rounded-md border bg-muted/40 p-3 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Subtotal</span>
            <span>{{ formatarMoeda(venda.subtotal) }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-muted-foreground">Desconto</span>
            <span>{{ formatarMoeda(venda.desconto) }}</span>
          </div>
          <div class="flex justify-between border-t pt-2 text-base font-semibold">
            <span>Total</span>
            <span>{{ formatarMoeda(venda.total) }}</span>
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button
          v-if="venda.situacao === 'finalizada'"
          variant="destructive"
          @click="emit('cancelar')"
        >
          Cancelar venda
        </Button>
        <Button variant="outline" @click="emit('fechar')">Fechar</Button>
      </DialogFooter>
    </ConteudoDoFormulario>
  </Dialog>
</template>
