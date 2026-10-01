# Tecnologias

Baseado no levantamento de tecnologias do projeto. Versões são as faixas do `composer.json` / `package.json`; a versão instalada exata está nos arquivos de lock.

## Backend — PHP / Laravel

**Runtime:** PHP 8.4 (`composer.json` aceita `^8.3`).

### Produção

| Pacote | Versão | Para quê |
| --- | --- | --- |
| `laravel/framework` | ^13 | Framework (somente API) |
| `stancl/tenancy` | ^3.10 | Multi-tenancy por subdomínio, um banco por prefeitura |
| `laravel/sanctum` | ^4.3 | Tokens de API |
| `spatie/laravel-permission` | ^8.3 | Papéis e permissões |
| `mpdf/mpdf` | ^8.3 | Geração de PDF (relatórios e documentos) |
| `mpdf/qrcode` | ^1.2 | QR Code nos documentos |
| `mews/purifier` | ^3.4 | Sanitização do HTML do editor rico |
| `league/flysystem-aws-s3-v3` | ^3.35 | Armazenamento S3 em produção |
| `laravel/tinker` | ^3.0 | Console interativo |

### Desenvolvimento

| Pacote | Versão | Para quê |
| --- | --- | --- |
| `phpunit/phpunit` | ^12.5 | Testes (SQLite) |
| `laravel/pint` | ^1.27 | Formatação PHP (`--test` no CI) |
| `fakerphp/faker` | ^1.23 | Dados falsos |
| `mockery/mockery` | ^1.6 | Mocks |
| `nunomaduro/collision` | ^8.6 | Erros legíveis no terminal |
| `laravel/pail` | ^1.2.5 | Logs em tempo real |
| `laravel/pao` | ^1.0.6 | Apoio ao desenvolvimento |

## Frontend — Vue / TypeScript

| Pacote | Para quê |
| --- | --- |
| `vue` ^3.5 | Interface (SFC com `<script setup lang="ts">`) |
| `typescript` ~6.0, `vue-tsc` ^3 | Tipagem e checagem dos `.vue` |
| `vite` ^8 + `@vitejs/plugin-vue` | Build e servidor de desenvolvimento |
| `vue-router` ^5 | Rotas (`src/router.ts`) |
| `tailwindcss` ^4 + `@tailwindcss/vite` | Estilos |
| `reka-ui` ^2 + shadcn-vue | Componentes (shadcn-vue sobre Reka UI, em `src/components/ui`) |
| `class-variance-authority`, `clsx`, `tailwind-merge`, `tw-animate-css` | Composição de classes e animações |
| `@tanstack/vue-query` ^5 | Cache e ciclo de vida das requisições |
| `axios` ^1 | Cliente HTTP (`src/lib/api.ts`) |
| `vee-validate` ^4, `zod` ^4 | Formulários e validação (adaptador em `src/lib/formularios.ts`) |
| `pdfjs-dist` ^6 | Visualizador de PDF (worker como módulo ES, `src/lib/pdf.ts`) |
| `@lucide/vue` | Ícones |
| `vue-sonner` | Notificações |
| `@vueuse/core` | Utilitários (tema claro/escuro com `useColorMode`, detecção de celular) |
| `@fontsource-variable/inter`, `/geist-mono` | Fontes |

**Gráficos:** sem biblioteca; SVG próprio em `src/components/graficos/`.

### Qualidade

- Vitest 4 + jsdom + Testing Library (vue, user-event, jest-dom). O jsdom roda no endereço de uma prefeitura (`demo.localhost`).
- ESLint 10 + eslint-plugin-vue + @vue/eslint-config-typescript + @vue/eslint-config-prettier.
- Prettier 3.

## Infraestrutura

Veja [Serviços Docker](servicos-docker.md) e [Publicar em produção](../guias/deploy.md).

| Ferramenta | Uso |
| --- | --- |
| Docker Compose | Ambiente de desenvolvimento |
| GitHub Actions | CI (`ci.yml`) e deploy (`deploy.yml`) |
| `shivammathur/setup-php` | PHP 8.4 no CI |
| `actions/setup-node` | Node 22 no CI |
| `appleboy/ssh-action` | Deploy por SSH |
