# Changelog

Todas as mudanças relevantes do ERP para Estudos são registradas aqui.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/) e o projeto usa [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não lançado]

### Adicionado

- Logout automático por inatividade: depois de 5 minutos sem mouse, teclado, toque ou rolagem (em qualquer aba aberta), o sistema encerra a sessão e volta ao login com o aviso "Sua sessão foi encerrada por inatividade."; ao entrar de novo, abre a tela em que o usuário estava. O backend também recusa o token sem uso há mais que o prazo. Prazo em `SESSAO_INATIVIDADE_MINUTOS`; rota `POST /api/sessao/renovar` ([ADR-0017](docs/adr/0017-logout-por-inatividade.md)).
- Alteração de cidades em **Administração › Tabelas Comuns › Cidades**: lápis em cada linha abre o formulário com nome e UF; o código do IBGE aparece só para leitura. Rota `PUT /api/administracao/tabelas-comuns/cidades/{id}`, só para o superadmin.
- Inclusão em todas as telas de **Administração › Tabelas Comuns**: botão "Novo…" com formulário em Cidades (código do IBGE, nome e UF), Bancos, CNAE (seção a subclasse, conferindo o formato e a hierarquia), Lista de Serviços (item ou subitem), SELIC (ano, mês e taxa), Segmentos, Numeração de Notas e Tipos de DAM. Rotas `POST /api/administracao/tabelas-comuns/*`.
- Telas **Administração › Tabelas Comuns › Numeração de Notas** (`ti_nota_numeracao`: automático, por data, normal) e **Administração › Tabelas Comuns › Tipos de DAM** (`ti_dam_tipo`: nota fiscal, alvará, IPTU, ITBI…): consultas do banco central ordenadas pelo código, com busca por código ou descrição. Rotas `GET /api/administracao/tabelas-comuns/numeracao-de-notas` e `GET /api/administracao/tabelas-comuns/tipos-de-dam`, só para o superadmin. Com elas, todas as telas de Tabelas Comuns estão prontas.
- Tela **Administração › Tabelas Comuns › Segmentos**: segmentos de arrecadação da FEBRABAN do banco central (`ti_segmentos`), ordenados pelo código, com busca por código ou descrição. O lápis abre a alteração da descrição (até 50 caracteres); o código fica só para leitura. Rotas `GET /api/administracao/tabelas-comuns/segmentos` e `PUT /api/administracao/tabelas-comuns/segmentos/{codigo}`, só para o superadmin.
- Tela **Administração › Tabelas Comuns › SELIC**: consulta das taxas mensais do banco central (`tc_selic`), da mais recente à mais antiga, com competência, mês por extenso e taxa em %, busca por competência ou mês e filtro por ano. Rota `GET /api/administracao/tabelas-comuns/selic`, só para o superadmin.
- Tela **Administração › Tabelas Comuns › Lista de Serviços - Lei Compl. 116/2003**: itens e subitens do banco central (`ti_lcp116`) ordenados pelo código, com recuo dos subitens, busca por código (com ou sem ponto) ou descrição e filtro por tipo. O lápis abre a alteração da descrição; o código fica só para leitura. Rotas `GET /api/administracao/tabelas-comuns/lista-de-servicos` e `PUT .../lista-de-servicos/{codigo}`, só para o superadmin.
- Tela **Administração › Tabelas Comuns › CNAE**: consulta das atividades do banco central (`ti_cnae`), versões 2.2 e 2.3, na ordem da hierarquia e com recuo por nível. Busca rápida por código (com ou sem pontuação) ou denominação e filtros por versão, nível e situação. Rota `GET /api/administracao/tabelas-comuns/cnae`, só para o superadmin.
- Tela **Administração › Tabelas Comuns › Bancos**: consulta dos bancos do banco central (`tc_banco`) com o código de compensação e busca rápida por código ou nome. Rota `GET /api/administracao/tabelas-comuns/bancos`, só para o superadmin.
- Tela **Administração › Tabelas Comuns › Cidades**: consulta das cidades do banco central (`tc_cidade`) com UF e código do IBGE, busca rápida por nome, UF ou código e filtro por UF. Rota `GET /api/administracao/tabelas-comuns/cidades`, só para o superadmin.
- Tela **Parâmetros da Empresa › Receitas**: formulário único em que a prefeitura define a receita (`tb_receita`) que cada tributo usa nos lançamentos (ISS, Taxa, TLL, IRPF, IRPJ, INSS, ITBI, Habite-se, IPTU, TCL, TCC, TIP e TLP). Rotas `GET/PUT /api/parametros/receitas` e `GET /api/parametros/receitas/opcoes`, com a permissão `parametros.receitas`.
- Padrão para telas novas sobre tabelas da prefeitura, em formulário único ou lista com cadastro ([guia](docs/guias/criar-tela.md)), e skill `nova-tela` do Claude Code.

- Estrutura do banco herdada do sistema legado ([ADR-0012](docs/adr/0012-schema-do-sistema-legado.md)): as 83 tabelas do schema `public` viraram migrations no banco de cada prefeitura (`database/migrations/tenant/`) e as 25 tabelas de `tbcomuns`/`tbinternas` (cidades, bancos, SELIC, CNAE, LCP 116, países, fatores do IPTU) viraram migrations no banco central. Chaves estrangeiras entre bancos não existem: as 37 referências da prefeitura para as tabelas de apoio ficaram como coluna, com a integridade na aplicação. Índices parciais/por expressão e restrições `CHECK` ficam numa migration em SQL, só no PostgreSQL. O schema `seguranca` do legado não foi migrado. Tabelas e colunas em [Banco de dados](docs/referencia/banco-de-dados.md).
- Grupo de acesso `Administrador` em toda prefeitura, com todas as telas: é do sistema, acompanha o catálogo (tela nova entra sozinha no próximo `acesso:sincronizar`) e não pode ser alterado nem excluído. O cadastro de empresa passa a exigir CPF, e-mail e senha do administrador e cria o usuário `admin_<subdomínio>` nesse grupo, vinculado à prefeitura nova ([ADR-0011](docs/adr/0011-grupo-administrador-e-admin-da-prefeitura.md)).
- Padrão de listagem (`components/listagem.tsx`) usado por todas as telas de lista, atuais e futuras: busca rápida à esquerda; Filtros e Colunas à direita (as colunas escolhidas ficam lembradas no navegador, por tela); rodapé com o total de registros, tamanho de página (15, 30, 50 ou 100) e navegação entre páginas. Aplicado em Empresas, Usuários e Grupos de acesso, com filtro por situação em Empresas e Usuários.
- Menu do usuário (rodapé do menu lateral) com o CPF, "Minha conta" e "Sair" em vermelho. "Minha conta" abre um diálogo com as abas **Meus dados** (nome e e-mail, que valem em todas as prefeituras) e **Senha** (troca conferindo a senha atual, encerrando as outras sessões). Rotas `PUT /api/me` e `PUT /api/me/senha`.
- Recuperação de senha por e-mail: link "Esqueci minha senha" no login, tela para pedir o link pelo CPF e tela para cadastrar a nova senha. O e-mail sai em fila, com link para o endereço da prefeitura, válido por 60 minutos e de uso único; trocar a senha derruba as sessões abertas. Rotas `POST /api/senha/esqueci` e `POST /api/senha/redefinir`, limitadas a 5 por minuto por CPF + IP.
- Estrutura inicial do monorepo: API Laravel 13 (`backend/`) e SPA React 19 (`frontend/`).
- Multi-tenancy com um banco por prefeitura (`erp_estudos_tenant_<id>`), identificada pelo subdomínio, com provisionamento em fila.
- Banco central `erp_estudos_central` com prefeituras, domínios, usuários e tokens.
- Login por e-mail e senha, com token Sanctum, vínculo usuário ↔ prefeitura (`tenant_user`) e limite de 5 tentativas por minuto.
- Rotas `POST /api/login`, `GET /api/me`, `POST /api/logout` e `GET /api/tenant`.
- Tela de login, rotas protegidas e botão Sair no frontend.
- Comando `php artisan usuarios:criar`.
- Ambiente Docker Compose: app, worker, nginx, PostgreSQL, Redis e Mailpit.
- CI (`ci.yml`) e deploy por SSH (`deploy.yml`) no GitHub Actions.
- Documentação em `docs/`: tutorial, guias, referência, arquitetura (arc42 + C4), ADRs (MADR) e contrato OpenAPI.
- Skills do Claude Code para shadcn/ui em `.claude/skills/` (versões fixadas em `skills-lock.json`).
- Skill `criar-pr` do Claude Code: commita as mudanças e abre um Pull Request para a `main`, na branch atual ou numa branch nova.
- Landing page do ERP para Estudos, exibida no domínio central e em endereços de prefeitura inexistente: cabeçalho com a marca, links para as seções e botão de tema claro/escuro; apresentação com a ilustração de um DAM; seções Como funciona, O sistema e Segurança. Sem campo para escolher a prefeitura: cada uma recebe o seu endereço (subdomínio) e o repassa aos usuários. No endereço de uma prefeitura, quem ainda não entrou vê a landing em `/`, com o botão "Painel" no canto superior direito, que leva ao login dela.
- Layout do sistema no modelo `sidebar-07` do shadcn/ui: seletor de prefeitura, menu de módulos (Início, Parâmetros, Tabelas, Lançamentos, Relatórios, Administração), menu do usuário com tema claro/escuro e breadcrumb. Parâmetros com as telas Empresa, Receitas, Nota Fiscal, Alvará, ITBI, IPTU, Habite-se, Certidão Negativa, Juros e Multa e Base Legal. Tabelas com as telas de cadastro de apoio e o submenu Tomadores de Serviço (o menu aceita submenus aninhados). Lançamentos com Documentos Avulsos, Nota Fiscal, Alvará, ITBI, Habite-se, IPTU, Certidão Negativa e os submenus Imóveis e DAM. Relatórios com rendimentos, receitas, relações de ISS, INSS e IRPF, Imóveis, ITBI, Habite-se, DAMs e os submenus Notas Fiscais, Alvarás e Contribuintes. Telas dos módulos ainda em construção.
- `GET /api/me` e `POST /api/login` retornam as prefeituras do usuário.
- Grupos de acesso Parâmetros, Tabelas e Lançamentos em cada prefeitura, com uma permissão por tela do menu (`config/acesso.php`). O menu e as rotas mostram só as telas permitidas; tela sem permissão mostra "Sem acesso". `GET /api/me` traz `grupos`, `permissoes` e `superadmin` ([ADR-0009](docs/adr/0009-grupos-de-acesso-e-empresas.md)).
- Superadmin (`users.superadmin`): acesso total, só na prefeitura `TENANT_ADMINISTRADOR` (padrão `demo`).
- Administração › Grupos de acesso (permissão `administracao.grupos`, no lugar da tela "Papéis e permissões"): cria, altera e exclui grupos marcando tela a tela, inclusive misturando módulos. Grupo em uso não é excluído. Rotas `GET`/`POST /api/grupos` e `PUT`/`DELETE /api/grupos/{id}` ([ADR-0010](docs/adr/0010-grupos-editaveis-na-tela.md)).
- Administração › Usuários (permissão `administracao.usuarios`): lista quem tem acesso à prefeitura, cadastra usuário (ou vincula um já existente pelo CPF, mantendo nome e senha), altera dados e grupos, ativa ou desativa o acesso (status por prefeitura, em `tenant_user.ativo`: encerra as sessões e bloqueia o login ali, mantendo cadastro e grupos) e tira o acesso à prefeitura. Rotas `GET`/`POST /api/usuarios`, `PUT`/`DELETE /api/usuarios/{id}`, `PUT /api/usuarios/{id}/status` e `GET /api/grupos`.
- Administração › Empresas (só superadmin): lista as prefeituras clientes e cadastra uma nova com nome, CNPJ (numérico ou alfanumérico) e endereço, provisionando o tenant, o banco e os grupos em fila. Rotas `GET` e `POST /api/empresas`.
- Comando `acesso:sincronizar` e opções `--grupo` e `--superadmin` em `usuarios:criar`.
- `GET /api/tenant` e as prefeituras do `/api/me` trazem o `nome` cadastrado.
- Campo `cpf` no cadastro de usuários (`users.cpf`, só dígitos, único) e opção `--cpf` no `usuarios:criar`.

### Alterado

- Frontend reescrito em **Vue 3** ([ADR-0016](docs/adr/0016-frontend-em-vue.md)), com shadcn-vue sobre Reka UI, vue-router, `@tanstack/vue-query`, vee-validate (zod 4), `@lucide/vue`, vue-sonner e `@vueuse/core`. Telas, rotas, textos e visual continuam os mesmos. O React e todas as dependências dele saíram do `package.json`, assim como `@tanstack/react-table`, `@tiptap/*` e `cmdk`, que não eram usados. Quem desenvolve: rode `npm install` em `frontend/` (o lockfile mudou) e entre de novo no sistema.
- O sistema passa a se chamar **ERP para Estudos** (antes STM — Sistema de Tributação Municipal) e o projeto, `erp_estudos`: projeto Compose `erp_estudos` (imagem `erp_estudos-php:dev`), bancos `erp_estudos_central` e `erp_estudos_tenant_<id>`, usuário do banco `erp_estudos`, pacotes `erp_estudos/backend` e `erp_estudos-frontend` e chaves `erp_estudos.*` no `localStorage` (é preciso entrar de novo). Ambientes existentes: faça backup, atualize `APP_NAME`, `DB_DATABASE` e `DB_USERNAME` no `backend/.env`, suba o projeto novo e restaure os dados nos bancos com os nomes novos, ajustando `tenants.data.tenancy_db_name`. A tabela `stm_migrations` e o valor `STMSIAT_WEB` são do legado e não mudaram.
- Banco de dados trocado de PostgreSQL 17 para **MySQL 8.4** ([ADR-0015](docs/adr/0015-mysql.md)): serviço `db` com a imagem `mysql:8.4` na porta `127.0.0.1:33061` e volume `mysql-data`, `pdo_mysql` na imagem PHP e `DB_CONNECTION=mysql`. Migrations da prefeitura ajustadas (tipos das chaves estrangeiras, `json` no lugar de `jsonb`, índices e `CHECK` do legado reescritos). Ambientes existentes: faça backup, troque `DB_CONNECTION`/`DB_PORT` no `backend/.env` (`mysql`/`3306`), recrie com `docker compose up -d --build` e rode `migrate` e `tenants:migrate`.
- O módulo **Parâmetros** do menu passou a se chamar **Parâmetros da Empresa** e fica logo abaixo de Relatórios. URLs (`/parametros/...`) e permissões (`parametros.*`) não mudaram.
- **Tabelas Comuns** (Cidades, Bancos, CNAE, Lista de Serviços, SELIC, Segmentos, Numeração de Notas e Tipos de DAM), que era o submenu Tabelas internas de Tabelas, agora fica em **Administração**, abaixo de Empresas, e é **só do superadmin** na prefeitura administradora ([ADR-0014](docs/adr/0014-tabelas-comuns-so-do-superadmin.md)): os dados são do banco central e valem para todas as prefeituras. As permissões `administracao.tabelas-comuns.*` saem do catálogo de grupos (nem o `Administrador` das prefeituras as tem, e a tela Grupos de acesso não as oferece) e as rotas `/api/administracao/tabelas-comuns/*` exigem o superadmin. Rode `acesso:sincronizar` para apagar as permissões antigas dos grupos.
- Administração › Usuários: os grupos saíram da edição do usuário e ganharam o botão "Editar vínculos", ao lado do lápis (`PUT /api/usuarios/{id}/vinculos`). O lápis passa a alterar só nome, e-mail e senha; no cadastro, os grupos continuam disponíveis.
- Tema do sistema trocado para o preset `modern-minimal` do [tweakcn](https://tweakcn.com/): primário azul, superfícies neutras, cantos um pouco menos arredondados (`--radius` 0.375rem) e paleta de gráficos (`--chart-1..5`). As fontes do projeto (Inter e Geist Mono) foram mantidas, e o token `--marca` da landing e do login passou a usar o mesmo matiz do azul primário.
- `acesso:sincronizar` deixa de reescrever as permissões dos grupos existentes: agora só acerta o catálogo de permissões e cria os grupos padrão que faltarem, para não desfazer o que foi montado na tela de grupos.
- Parâmetros: removida a tela Empresa. O cadastro de empresas foi para Administração › Empresas.
- Tela de login em duas colunas, no visual da landing: à esquerda, painel azul-marinho (sempre escuro) com a apresentação do ERP para Estudos e três destaques; à direita, o formulário de CPF e senha com o nome da prefeitura, o botão de tema e o link para voltar à página inicial. No celular, só o formulário.
- Login por CPF e senha no lugar de e-mail e senha. O campo CPF tem máscara `000.000.000-00`, e os dígitos verificadores são conferidos. O e-mail continua no cadastro. Usuários antigos precisam receber um CPF (`usuarios:criar <email> <nome> --cpf=...`) para entrar ([ADR-0008](docs/adr/0008-login-por-cpf.md)).
- Banco de dados trocado de MariaDB 11 para PostgreSQL 17 (`DB_CONNECTION=pgsql`, porta `54321` no host, usuário `stm`). Os dados do MariaDB não são migrados; o volume antigo `stm_db-data` fica intacto ([ADR-0007](docs/adr/0007-postgresql.md)).
- Menu lateral: linha separando cada módulo do menu principal, sem o rótulo "Módulos".
- Menu lateral: ícone em cada tela e submenu, não só nos módulos.
- Botão de tema no canto superior direito (fora do menu do usuário), que alterna entre claro e escuro. Sem a opção Sistema: o tema padrão é o claro.
- Linha divisória de ponta a ponta entre o cabeçalho (seletor de prefeitura, breadcrumb e tema) e a área da tela.
- Menu lateral com largura ajustável: arraste a borda direita (de 224 a 480 px). A largura fica salva no navegador.

### Removido

- Skills `shadcn` e `migrate-radix-to-base` de `.claude/skills/` (eram do shadcn/ui para React).
- Dependências do PostgreSQL: conexão `pgsql`, gerenciador `PostgreSQLDatabaseManager`, extensão `pdo_pgsql`/`libpq-dev` e o SQL próprio do PostgreSQL nas migrations.
- Coluna `id_empresa` das 38 tabelas herdadas do legado que a tinham, e a tabela `tb_empresa` ([ADR-0013](docs/adr/0013-remove-id-empresa.md)): no legado ela separava as prefeituras num banco só; no ERP para Estudos cada prefeitura já tem o seu. Índices que combinavam `id_empresa` com outras colunas continuam só com as outras (ex.: `tb_servico` único por `codigo_servico`). Migration nova, `2026_09_24_120000_remove_id_empresa_do_legado.php`: rode `tenants:migrate` nos bancos já criados.

### Corrigido

- Endereço de prefeitura inexistente respondia 500; agora responde 404 "Prefeitura não encontrada."

### Segurança

- Testes só rodam em SQLite; `TestCase` aborta se a conexão for outra, evitando apagar o banco de desenvolvimento.
