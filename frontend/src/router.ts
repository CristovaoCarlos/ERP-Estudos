import { markRaw, type Component } from 'vue'
import { createRouter, type RouteRecordRaw, type RouterHistory } from 'vue-router'

import AppLayout from '@/components/AppLayout.vue'
import RotaProtegida from '@/components/RotaProtegida.vue'
import Tela from '@/components/Tela.vue'
import { telas } from '@/lib/navegacao'
import Empresas from '@/pages/administracao/Empresas.vue'
import Grupos from '@/pages/administracao/Grupos.vue'
import Bancos from '@/pages/administracao/tabelas-comuns/Bancos.vue'
import Cidades from '@/pages/administracao/tabelas-comuns/Cidades.vue'
import Cnae from '@/pages/administracao/tabelas-comuns/Cnae.vue'
import ListaDeServicos from '@/pages/administracao/tabelas-comuns/ListaDeServicos.vue'
import NumeracaoDeNotas from '@/pages/administracao/tabelas-comuns/NumeracaoDeNotas.vue'
import Segmentos from '@/pages/administracao/tabelas-comuns/Segmentos.vue'
import Selic from '@/pages/administracao/tabelas-comuns/Selic.vue'
import TiposDeDam from '@/pages/administracao/tabelas-comuns/TiposDeDam.vue'
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
  '/administracao/tabelas-comuns/bancos': Bancos,
  '/administracao/tabelas-comuns/cidades': Cidades,
  '/administracao/tabelas-comuns/cnae': Cnae,
  '/administracao/tabelas-comuns/lista-de-servicos': ListaDeServicos,
  '/administracao/tabelas-comuns/numeracao-de-notas': NumeracaoDeNotas,
  '/administracao/tabelas-comuns/segmentos': Segmentos,
  '/administracao/tabelas-comuns/selic': Selic,
  '/administracao/tabelas-comuns/tipos-de-dam': TiposDeDam,
  '/administracao/usuarios': Usuarios,
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
