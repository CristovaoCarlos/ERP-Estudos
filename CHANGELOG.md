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
- Ambiente Docker Compose: app, worker, nginx, PostgreSQL, Redis e Mailpit.
- CI (`ci.yml`) e deploy por SSH (`deploy.yml`) no GitHub Actions.
- Documentação em `docs/`: tutorial, guias, referência, arquitetura (arc42 + C4), ADRs (MADR) e contrato OpenAPI.
- Skills do Claude Code para shadcn/ui em `.claude/skills/` (versões fixadas em `skills-lock.json`).
- Skill `criar-pr` do Claude Code: commita as mudanças e abre um Pull Request para a `main`, na branch atual ou numa branch nova.
- Landing page do STM, exibida no domínio central e em endereços de prefeitura inexistente: cabeçalho com a marca, links para as seções e botão de tema claro/escuro; apresentação com a ilustração de um DAM; seções Como funciona, O sistema e Segurança. Sem campo para escolher a prefeitura: cada uma recebe o seu endereço (subdomínio) e o repassa aos usuários. No endereço de uma prefeitura, quem ainda não entrou vê a landing em `/`, com o botão "Painel" no canto superior direito, que leva ao login dela.
- Layout do sistema no modelo `sidebar-07` do shadcn/ui: seletor de prefeitura, menu de módulos (Início, Parâmetros, Tabelas, Lançamentos, Relatórios, Administração), menu do usuário com tema claro/escuro e breadcrumb. Parâmetros com as telas Empresa, Receitas, Nota Fiscal, Alvará, ITBI, IPTU, Habite-se, Certidão Negativa, Juros e Multa e Base Legal. Tabelas com as telas de cadastro de apoio e os submenus Tomadores de Serviço e Tabelas internas (o menu aceita submenus aninhados). Lançamentos com Documentos Avulsos, Nota Fiscal, Alvará, ITBI, Habite-se, IPTU, Certidão Negativa e os submenus Imóveis e DAM. Relatórios com rendimentos, receitas, relações de ISS, INSS e IRPF, Imóveis, ITBI, Habite-se, DAMs e os submenus Notas Fiscais, Alvarás e Contribuintes. Telas dos módulos ainda em construção.
- `GET /api/me` e `POST /api/login` retornam as prefeituras do usuário.
- Campo `cpf` no cadastro de usuários (`users.cpf`, só dígitos, único) e opção `--cpf` no `usuarios:criar`.

### Alterado

- Login por CPF e senha no lugar de e-mail e senha. O campo CPF tem máscara `000.000.000-00`, e os dígitos verificadores são conferidos. O e-mail continua no cadastro. Usuários antigos precisam receber um CPF (`usuarios:criar <email> <nome> --cpf=...`) para entrar ([ADR-0008](docs/adr/0008-login-por-cpf.md)).
- Banco de dados trocado de MariaDB 11 para PostgreSQL 17 (`DB_CONNECTION=pgsql`, porta `54321` no host, usuário `stm`). Os dados do MariaDB não são migrados; o volume antigo `stm_db-data` fica intacto ([ADR-0007](docs/adr/0007-postgresql.md)).
- Menu lateral: linha separando cada módulo do menu principal, sem o rótulo "Módulos".
- Menu lateral: ícone em cada tela e submenu, não só nos módulos.
- Botão de tema no canto superior direito (fora do menu do usuário), que alterna entre claro e escuro. Sem a opção Sistema: o tema padrão é o claro.
- Linha divisória de ponta a ponta entre o cabeçalho (seletor de prefeitura, breadcrumb e tema) e a área da tela.
- Menu lateral com largura ajustável: arraste a borda direita (de 224 a 480 px). A largura fica salva no navegador.

### Corrigido

- Endereço de prefeitura inexistente respondia 500; agora responde 404 "Prefeitura não encontrada."

### Segurança

- Testes só rodam em SQLite; `TestCase` aborta se a conexão for outra, evitando apagar o banco de desenvolvimento.
