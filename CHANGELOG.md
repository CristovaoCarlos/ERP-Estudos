# Changelog

Todas as mudanças relevantes do STM são registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Estrutura inicial do monorepo: API Laravel 13 (`backend/`) e SPA React 19 (`frontend/`).
- Multi-tenancy com um banco por prefeitura (`stm_tenant_<id>`), identificada pelo subdomínio, com provisionamento em fila.
- Banco central `stm_central` com prefeituras, domínios, usuários e tokens.
- Login por e-mail e senha, com token Sanctum, vínculo usuário ↔ prefeitura (`tenant_user`) e limite de 5 tentativas por minuto.
- Rotas `POST /api/login`, `GET /api/me`, `POST /api/logout` e `GET /api/tenant`.
- Tela de login, rotas protegidas e botão Sair no frontend.
- Comando `php artisan usuarios:criar`.
- Ambiente Docker Compose: app, worker, nginx, MariaDB, Redis e Mailpit.
- CI (`ci.yml`) e deploy por SSH (`deploy.yml`) no GitHub Actions.
- Documentação em `docs/`: tutorial, guias, referência, arquitetura (arc42 + C4), ADRs (MADR) e contrato OpenAPI.
- Skills do Claude Code para shadcn/ui em `.claude/skills/` (versões fixadas em `skills-lock.json`).
- Landing page do STM, exibida no domínio central e em endereços de prefeitura inexistente, com campo para ir ao login da prefeitura.
- Layout do sistema no modelo `sidebar-07` do shadcn/ui: seletor de prefeitura, menu de módulos (Cadastros, Tributos, Arrecadação, Dívida ativa, Relatórios, Administração), menu do usuário com tema claro/escuro e breadcrumb. Telas dos módulos ainda em construção.
- `GET /api/me` e `POST /api/login` retornam as prefeituras do usuário.

### Corrigido

- Endereço de prefeitura inexistente respondia 500; agora responde 404 "Prefeitura não encontrada."

### Segurança

- Testes só rodam em SQLite; `TestCase` aborta se a conexão for outra, evitando apagar o banco de desenvolvimento.
