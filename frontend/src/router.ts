import { markRaw, type Component } from 'vue'
import { createRouter, type RouteRecordRaw, type RouterHistory } from 'vue-router'

import AppLayout from '@/components/AppLayout.vue'
import RotaProtegida from '@/components/RotaProtegida.vue'
import Tela from '@/components/Tela.vue'
import { telas } from '@/lib/navegacao'
import Empresas from '@/pages/administracao/Empresas.vue'
import Grupos from '@/pages/administracao/Grupos.vue'
import Cidades from '@/pages/administracao/tabelas-comuns/Cidades.vue'
import Clientes from '@/pages/cadastros/Clientes.vue'
import Usuarios from '@/pages/administracao/Usuarios.vue'
import EmConstrucao from '@/pages/EmConstrucao.vue'
import EsqueciSenha from '@/pages/EsqueciSenha.vue'
import Inicio from '@/pages/Inicio.vue'
import Login from '@/pages/Login.vue'
import RedefinirSenha from '@/pages/RedefinirSenha.vue'

/** Telas já implementadas; as demais do menu abrem `EmConstrucao`. */
const paginas: Record<string, Component> = {
  '/administracao/empresas': Empresas,
  '/administracao/grupos': Grupos,
  '/administracao/tabelas-comuns/cidades': Cidades,
  '/administracao/usuarios': Usuarios,
  '/cadastros/clientes': Clientes,
}

export const rotas: RouteRecordRaw[] = [
  { path: '/login', component: Login },
  { path: '/esqueci-senha', component: EsqueciSenha },
  { path: '/redefinir-senha', component: RedefinirSenha },
  {
    path: '/',
    component: RotaProtegida,
    children: [
      {
        path: '',
        component: AppLayout,
        children: [
          { path: '', component: Inicio },
          ...telas
            .filter((tela) => tela.url !== '/')
            .map((tela) => ({
              path: tela.url,
              component: Tela,
              props: { url: tela.url, pagina: markRaw(paginas[tela.url] ?? EmConstrucao) },
            })),
          { path: '/:caminho(.*)*', component: EmConstrucao },
        ],
      },
    ],
  },
]

/** Router do app (histórico do navegador) ou dos testes (histórico em memória). */
export function criarRouter(history: RouterHistory) {
  return createRouter({ history, routes: rotas })
}
