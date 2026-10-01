import { QueryClient, VueQueryPlugin } from '@tanstack/vue-query'
import { createApp } from 'vue'
import { createWebHistory } from 'vue-router'

import App from '@/App.vue'
import { iniciarTema } from '@/lib/tema'
import { criarRouter } from '@/router'
import '@/index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, refetchOnWindowFocus: false } },
})

iniciarTema()

createApp(App)
  .use(VueQueryPlugin, { queryClient })
  .use(criarRouter(createWebHistory()))
  .mount('#app')
