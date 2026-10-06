# ERP para Estudos

Monorepo multi-tenant: `backend/` (Laravel 13, só API, PHP 8.4) + `frontend/` (Vue 3, Vite 8, TypeScript 6; ADR-0016). Cada prefeitura é um tenant com banco próprio, identificada pelo subdomínio (`Host`). Documentação completa em `docs/` — comece por `docs/arquitetura/arc42.md`.

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
- **Não** adicione `env_file` ao `docker-compose.yml`: ele injeta `DB_CONNECTION=mysql` no ambiente e faz os testes (com `RefreshDatabase` e exclusão de tenants) apagarem o banco real. Isso já aconteceu (ADR-0006).
- Banco de desenvolvimento: MySQL 8.4 (ADR-0015, que substituiu o PostgreSQL do ADR-0007). Antes de qualquer operação destrutiva, faça dump: `docker compose exec -T db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases --single-transaction --routines' > backup.sql`.
- Migrations de prefeitura: coluna de FK com o mesmo tipo da chave referenciada (`unsignedBigInteger` para `bigIncrements`, `unsignedInteger` para `increments`); o MySQL recusa a FK se o tipo ou o sinal diferirem. `TEXT` não aceita índice nem default literal (use `new Expression("('valor')")`).

## Multi-tenancy (não óbvio)

- Banco central: `erp_estudos_central`. Bancos de prefeitura: `erp_estudos_tenant_<id>` (prefixo em `config/tenancy.php`). O nome também fica gravado em `tenants.data.tenancy_db_name` — renomear banco exige atualizar esse campo.
- Usuários, tokens, sessões e reset de senha ficam **só no central**. `User` e `PersonalAccessToken` usam `CentralConnection`. Não crie essas tabelas em `database/migrations/tenant/`.
- Acesso usuário ↔ prefeitura: tabela `tenant_user`. Toda rota autenticada de prefeitura usa `auth:sanctum` + `EnsureUserBelongsToTenant`.
- Papéis/permissões (spatie) ficam **no banco de cada prefeitura**. Use `App\Models\Role`/`Permission` (conexão `tenant` fixa); os models do spatie herdariam a conexão central do `User`.
- Grupo `Administrador` (todas as telas) existe em toda prefeitura e é mantido pelo sistema: não é alterado nem excluído pela API. Cadastrar empresa cria o usuário `admin_<subdominio>` nele.
- Tela nova no menu: adicione a permissão (nome = URL com `.` no lugar de `/`) em `backend/config/acesso.php` e rode `acesso:sincronizar` (ele não mexe em grupos já existentes; quem edita grupos é a tela Administração › Grupos de acesso). Superadmin só vale na prefeitura `TENANT_ADMINISTRADOR` (`demo`); só ele acessa Administração › Empresas, que provisiona tenants, e Administração › Tabelas Comuns (banco central, vale para todas as prefeituras; ADR-0014). Telas só dele ficam na chave `superadmin` de `config/acesso.php`, fora do catálogo de grupos.
- Rotas de prefeitura: `routes/tenant.php`. Rotas centrais: `routes/api.php` (restritas a `CENTRAL_DOMAINS`).
- Criação de prefeitura provisiona o banco **em fila** (worker). Em testes a fila é `sync`.
- O usuário `erp_estudos` cria os bancos `erp_estudos_tenant_*` graças a `docker/mysql/init/01-permissoes.sql`, que só roda na primeira inicialização do volume `mysql-data`.
- Fotos de usuário ficam no disco `fotos` (`storage/app/fotos`), fora dos discos com sufixo por prefeitura (`config/tenancy.php`), porque o usuário é o mesmo em todas. São servidas por `GET /api/fotos/{arquivo}`: a pasta `public` montada no nginx não enxerga o storage.
- `id_empresa` e `tb_empresa` do legado foram removidos (ADR-0013): o banco já é da prefeitura. Não crie campo, filtro nem coluna de empresa.
- Ids de tenant podem ter `_`, mas domínios usam `-` (hostnames não aceitam `_`).
- O proxy do Vite usa `changeOrigin: false` para preservar o `Host`; não mude.

## Testes

- Backend: rotas de prefeitura são testadas criando o tenant e chamando `http://<id>.localhost/api/...`; apague o tenant no `tearDown` (veja `tests/Feature/AuthTest.php`).
- Frontend: jsdom roda em `http://demo.localhost:5173`; mock de `api.get`/`api.post` com `vi.spyOn` (veja `src/App.test.ts`). A validação dos formulários (vee-validate) é assíncrona: confira a chamada à API com `esperarChamada`, não com `expect(...).toHaveBeenCalledWith` logo após o clique.
- Antes de concluir, rode as checagens do CI: `pint --test`, `php artisan test`, `typecheck`, `lint`, `format:check`, `test`, `build`.

## Convenções

- Nomes de domínio em português (`Relatorios`, `usuarios:criar`, `acessaTenant`); termos do framework em inglês.
- Frontend em **Vue 3** (SFC `<script setup lang="ts">`, componentes em PascalCase). Não há React no projeto; não adicione pacotes `react*`.
- Componentes de UI: **shadcn-vue** sobre `reka-ui` em `src/components/ui`. Para adicionar: `npx shadcn-vue@latest add <componente> --yes --overwrite` (no contêiner node, com `HOME=/tmp`) e depois `npx prettier --write src/components/ui`. Ícones de `@lucide/vue`.
- Formulários: `useFormulario(esquemaZod, valoresIniciais)` de `src/lib/formularios.ts` (vee-validate + zod 4; o `@vee-validate/zod` oficial só aceita zod 3). `campo('nome')` dá o `v-model`; erros 422 com `mostrarErrosDoServidor`. Diálogo de formulário usa `ConteudoDoFormulario` (no lugar do `DialogContent`, com `chave` própria): redimensionável, e o tamanho fica guardado por formulário.
- **Tela nova sobre tabela da prefeitura** (formulário único de parâmetros ou lista com cadastro, com a API): siga `docs/guias/criar-tela.md` (skill `nova-tela`).
- Toda tela de listagem usa `src/components/Listagem.vue`: busca rápida à esquerda, Filtros e Colunas à direita, tabela e rodapé com total e paginação. A tela só declara as colunas (`Coluna<T>` de `src/lib/listagem.ts`, com `valor` para o texto e `busca` para entrar na busca rápida), o slot `#coluna-<id>` para células com badge ou botões e, se houver, o slot `#filtros` (opções com `ItemDeFiltro` e `useSelecao`).
- Layout do sistema: modelo `sidebar-07` (`src/components/AppLayout.vue`). Módulos e telas ficam **só** em `src/lib/navegacao.ts`, que alimenta menu, rotas e breadcrumb. Tela nova: adicione ali e troque `EmConstrucao` pela página real no mapa `paginas` de `src/router.ts`.
- Sem prefeitura no endereço (domínio central ou prefeitura inexistente) o frontend mostra a landing page (`src/pages/Landing.vue`).
- Testes de menus (`DropdownMenu`): abra pelo teclado (`gatilho.focus()` + `{Enter}`), como no helper `abrirMenu` de `src/App.test.ts`. Monte o app com `await renderizar(App, rota)`, que já instala o vue-query e o router em memória.
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
