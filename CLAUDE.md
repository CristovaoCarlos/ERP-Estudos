# STM — Sistema de Tributação Municipal

Monorepo multi-tenant: `backend/` (Laravel 13, só API, PHP 8.4) + `frontend/` (React 19, Vite 8, TypeScript 6). Cada prefeitura é um tenant com banco próprio, identificada pelo subdomínio (`Host`). Documentação completa em `docs/` — comece por `docs/arquitetura/arc42.md`.

Responda e escreva mensagens, documentação e textos de interface em **português do Brasil**.

## Onde rodar os comandos

- **Não há PHP, Composer nem Node instalados no host.** Não instale.
- Backend: `docker compose exec app <comando>` (ex.: `php artisan test`, `vendor/bin/pint`, `composer require ...`).
- Frontend (o desenvolvedor roda fora do Docker, com Node 22 local). Para verificar sem Node no host, use um contêiner descartável:
  `docker run --rm --user "$(id -u):$(id -g)" -e npm_config_cache=/tmp/npm -v "$PWD/frontend":/app -w /app node:22 npm run <script>`
- **Não** adicione o frontend ao `docker-compose.yml` (decisão do usuário, ADR-0005).
- Build do Compose: `HOST_UID=$(id -u) HOST_GID=$(id -g) docker compose up -d --build` (`UID` é somente leitura no bash).
- Se o `app` for recriado e o nginx der 502: `docker compose restart nginx`.

## Segurança do banco de desenvolvimento

- Testes rodam **só em SQLite**. `tests/TestCase.php` aborta se a conexão for outra. Nunca contorne essa trava.
- **Não** adicione `env_file` ao `docker-compose.yml`: ele injeta `DB_CONNECTION=pgsql` no ambiente e faz os testes (com `RefreshDatabase` e exclusão de tenants) apagarem o banco real. Isso já aconteceu (ADR-0006).
- Banco de desenvolvimento: PostgreSQL 17 (ADR-0007). Antes de qualquer operação destrutiva, faça dump: `docker compose exec db pg_dumpall -U stm > backup.sql`.

## Multi-tenancy (não óbvio)

- Banco central: `stm_central`. Bancos de prefeitura: `stm_tenant_<id>` (prefixo em `config/tenancy.php`). O nome também fica gravado em `tenants.data.tenancy_db_name` — renomear banco exige atualizar esse campo.
- Usuários, tokens, sessões e reset de senha ficam **só no central**. `User` e `PersonalAccessToken` usam `CentralConnection`. Não crie essas tabelas em `database/migrations/tenant/`.
- Acesso usuário ↔ prefeitura: tabela `tenant_user`. Toda rota autenticada de prefeitura usa `auth:sanctum` + `EnsureUserBelongsToTenant`.
- Papéis/permissões (spatie) ficam **no banco de cada prefeitura**.
- Rotas de prefeitura: `routes/tenant.php`. Rotas centrais: `routes/api.php` (restritas a `CENTRAL_DOMAINS`).
- Criação de prefeitura provisiona o banco **em fila** (worker). Em testes a fila é `sync`.
- No PostgreSQL, `DROP DATABASE` falha se houver conexão aberta no banco da prefeitura (ex.: psql/DBeaver): feche-as antes de excluir um tenant.
- Ids de tenant podem ter `_`, mas domínios usam `-` (hostnames não aceitam `_`).
- O proxy do Vite usa `changeOrigin: false` para preservar o `Host`; não mude.

## Testes

- Backend: rotas de prefeitura são testadas criando o tenant e chamando `http://<id>.localhost/api/...`; apague o tenant no `tearDown` (veja `tests/Feature/AuthTest.php`).
- Frontend: jsdom roda em `http://lemarq.localhost:5173`; mock de `api.get`/`api.post` com `vi.spyOn` (veja `src/App.test.tsx`).
- Antes de concluir, rode as checagens do CI: `pint --test`, `php artisan test`, `typecheck`, `lint`, `format:check`, `test`, `build`.

## Convenções

- Nomes de domínio em português (`Relatorios`, `usuarios:criar`, `acessaTenant`); termos do framework em inglês.
- Componentes de UI: shadcn/ui sobre `radix-ui` em `src/components/ui` (skill `shadcn` em `.claude/skills/`). O projeto usa **Radix**; não migre para Base UI sem pedido explícito.
- `npx shadcn@latest add ...` (rode no contêiner node, com `HOME=/tmp`) gera imports `from "cn"` e instala o pacote `cn`. O projeto usa `cn` de `@/lib/utils`: depois de todo `add`, troque os imports e rode `npm uninstall cn`. Use `--overwrite` se o CLI perguntar sobre arquivo existente (sem TTY ele aborta).
- Layout do sistema: modelo `sidebar-07` (`src/components/AppLayout.tsx`). Módulos e telas ficam **só** em `src/lib/navegacao.ts`, que alimenta menu, rotas e breadcrumb. Tela nova: adicione ali e troque `EmConstrucao` pela página real em `App.tsx`.
- Sem prefeitura no endereço (domínio central ou prefeitura inexistente) o frontend mostra a landing page (`src/pages/Landing.tsx`).
- Testes de menus Radix (`DropdownMenu`): abra pelo teclado (`gatilho.focus()` + `{Enter}`), como no helper `abrirMenu` de `src/App.test.tsx`. Clique via `user-event` abre e fecha o menu no jsdom quando outro teste renderizou o login antes.
- Gráficos: SVG próprio em `src/components/graficos/`, sem biblioteca de charts.
- HTML do editor rico deve passar por `mews/purifier` antes de ser salvo (o token fica no `localStorage`).
- Commits: Conventional Commits em português (`feat(auth): ...`). Só commite quando pedido.

## Mantenha a documentação junto com o código

| Mudança | Atualize |
| --- | --- |
| Rota da API | `docs/referencia/openapi.yaml` e `docs/referencia/api.md` |
| Variável no `.env.example` | `docs/referencia/configuracao.md` |
| Comando artisan | `docs/referencia/comandos.md` |
| Decisão de arquitetura | novo ADR em `docs/adr/` (MADR; não reescreva ADR aceito) |
| Mudança visível | `CHANGELOG.md`, seção `Não lançado` |
