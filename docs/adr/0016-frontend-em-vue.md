---
status: aceita
data: 2026-10-01
decisores: equipe ERP para Estudos
---

# Frontend em Vue 3

Substitui a parte "SPA React" do [ADR-0001](0001-monorepo-laravel-react.md); o monorepo com a API Laravel continua.

## Contexto e problema

O frontend foi escrito em React 19 com shadcn/ui sobre Radix. A equipe decidiu trocar o React por Vue e remover todas as dependências do React. Com o que substituir cada peça, mantendo o visual, as telas e o comportamento (os testes do frontend são a régua)?

## Opções consideradas

- Vue 3 com **shadcn-vue + Reka UI**
- Vue 3 com PrimeVue
- Vue 3 com Vuetify

## Decisão

Opção escolhida: **Vue 3 com shadcn-vue sobre Reka UI**, o port do shadcn/ui para Vue: os mesmos componentes, as mesmas classes Tailwind e o mesmo tema, então o visual não muda.

| Antes (React) | Agora (Vue) |
| --- | --- |
| `react`, `react-dom` | `vue` (SFC com `<script setup lang="ts">`) |
| `react-router-dom` | `vue-router` (`src/router.ts`) |
| `@tanstack/react-query` | `@tanstack/vue-query` (mesma API, resultados em `ref`) |
| `react-hook-form` + `@hookform/resolvers` | `vee-validate` + adaptador próprio para o zod 4 (`src/lib/formularios.ts`) |
| `radix-ui` + shadcn/ui | `reka-ui` + shadcn-vue (`src/components/ui`) |
| `lucide-react` | `@lucide/vue` |
| `sonner` | `vue-sonner` |
| `next-themes` | `useColorMode` do `@vueuse/core` (`src/lib/tema.ts`) |
| `@testing-library/react` | `@testing-library/vue` |
| `@vitejs/plugin-react`, `eslint-plugin-react-*`, `tsc` | `@vitejs/plugin-vue`, `eslint-plugin-vue`, `vue-tsc` |

- `@tanstack/react-table`, `@tiptap/*` e `cmdk` não eram usados e saíram sem substituto.
- O adaptador oficial `@vee-validate/zod` só aceita o zod 3; o `esquemaZod()` de `src/lib/formularios.ts` faz o mesmo papel para o zod 4.
- A `Listagem` recebe as colunas como antes; o conteúdo rico de uma célula vem do slot `#coluna-<id>` da tela, e o menu Filtros do slot `#filtros`.
- Os skills do shadcn/ui para React (`shadcn`, `migrate-radix-to-base`) saíram de `.claude/skills/`.

### Consequências

- Bom, porque telas, textos, rotas e visual ficaram iguais: os 136 testes do frontend foram portados com as mesmas asserções.
- Bom, porque o token da sessão virou um `ref`: menu, rotas protegidas e consultas reagem ao login e ao logout sem recarregar.
- Ruim, porque a validação do vee-validate é sempre assíncrona: nos testes, a chamada à API depois do envio é esperada com `vi.waitFor` (helper `esperarChamada`).
- Ruim, porque o shadcn-vue é um port mantido pela comunidade; componentes novos chegam a ele depois do shadcn/ui.

### Confirmação

`npm run typecheck` (vue-tsc), `lint`, `format:check`, `test` e `build` passam; `package.json` não tem nenhum pacote `react*`, `radix-ui`, `lucide-react`, `sonner` nem `next-themes`.
