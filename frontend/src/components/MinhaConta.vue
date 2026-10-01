<script setup lang="ts">
import { ref } from 'vue'

import MeusDados from '@/components/minha-conta/MeusDados.vue'
import TrocaDeSenha from '@/components/minha-conta/TrocaDeSenha.vue'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import type { Usuario } from '@/lib/auth'

/** Dados do próprio usuário e troca de senha, abertos pelo menu do rodapé. */
defineProps<{ usuario: Usuario }>()
const emit = defineEmits<{ fechar: [] }>()

const aba = ref('dados')
</script>

<template>
  <Dialog :open="true" @update:open="(abrir) => !abrir && emit('fechar')">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Minha conta</DialogTitle>
        <DialogDescription>
          Foto, nome e e-mail valem em todas as prefeituras em que você trabalha.
        </DialogDescription>
      </DialogHeader>
      <Tabs v-model="aba">
        <TabsList class="w-full">
          <TabsTrigger value="dados">Meus dados</TabsTrigger>
          <TabsTrigger value="senha">Senha</TabsTrigger>
        </TabsList>
        <TabsContent value="dados" class="pt-4">
          <MeusDados :usuario="usuario" @fechar="emit('fechar')" />
        </TabsContent>
        <TabsContent value="senha" class="pt-4">
          <TrocaDeSenha @fechar="emit('fechar')" />
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
