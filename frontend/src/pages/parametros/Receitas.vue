<script setup lang="ts">
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { tributos, useOpcoesParametroReceita, useParametroReceita } from '@/lib/parametros-receitas'
import FormularioDeReceitas from '@/pages/parametros/receitas/FormularioDeReceitas.vue'

const parametro = useParametroReceita()
const opcoes = useOpcoesParametroReceita()
</script>

<template>
  <div class="flex flex-col gap-6">
    <div class="flex flex-col gap-1">
      <h1 class="text-2xl font-semibold tracking-tight">Receitas</h1>
      <p class="text-muted-foreground">
        Defina a receita que cada tributo usa nos lançamentos. Tributo sem receita fica sem
        lançamento.
      </p>
    </div>

    <Alert v-if="parametro.isError.value || opcoes.isError.value" variant="destructive">
      <AlertTitle>Não foi possível carregar os parâmetros</AlertTitle>
      <AlertDescription>Tente novamente em alguns instantes.</AlertDescription>
    </Alert>
    <Card v-else>
      <FormularioDeReceitas
        v-if="parametro.data.value && opcoes.data.value"
        :parametro="parametro.data.value"
        :receitas="opcoes.data.value.receitas"
      />
      <CardContent v-else class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton v-for="tributo in tributos" :key="tributo.chave" class="h-14 w-full" />
      </CardContent>
    </Card>
  </div>
</template>
