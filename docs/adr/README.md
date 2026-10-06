# Decisões de arquitetura (ADRs)

Cada decisão de arquitetura relevante é registrada aqui, no formato [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records).

| Nº | Decisão | Status |
| --- | --- | --- |
| [0000](0000-registrar-decisoes-com-madr.md) | Registrar decisões de arquitetura com MADR | Aceita |
| [0001](0001-monorepo-laravel-react.md) | Monorepo com API Laravel e SPA React | Aceita; SPA React substituída por Vue em [0016](0016-frontend-em-vue.md) |
| [0002](0002-multi-tenancy-banco-por-prefeitura.md) | Multi-tenancy com um banco por prefeitura, identificada pelo subdomínio | Aceita |
| [0003](0003-usuarios-centralizados.md) | Usuários e tokens centralizados no `erp_estudos_central` | Aceita |
| [0004](0004-autenticacao-por-token.md) | Autenticação por token do Sanctum com vínculo usuário ↔ prefeitura | Aceita |
| [0005](0005-frontend-fora-do-docker.md) | Frontend roda fora do Docker em desenvolvimento | Aceita |
| [0006](0006-testes-em-sqlite.md) | Testes em SQLite, com trava contra o banco real | Aceita |
| [0007](0007-postgresql.md) | PostgreSQL 17 como banco de dados | Substituída por [0015](0015-mysql.md) |
| [0008](0008-login-por-cpf.md) | Login por CPF no lugar do e-mail | Aceita |
| [0009](0009-grupos-de-acesso-e-empresas.md) | Grupos de acesso por módulo, superadmin e cadastro de empresas | Aceita |
| [0010](0010-grupos-editaveis-na-tela.md) | Grupos de acesso montados pela prefeitura, na tela | Aceita |
| [0011](0011-grupo-administrador-e-admin-da-prefeitura.md) | Grupo Administrador do sistema e o usuário admin de cada prefeitura | Aceita |
| [0012](0012-schema-do-sistema-legado.md) | Estrutura do banco herdada do sistema legado | Aceita; `id_empresa` substituído por [0013](0013-remove-id-empresa.md) |
| [0013](0013-remove-id-empresa.md) | Remoção de `id_empresa` e `tb_empresa` do banco da prefeitura | Aceita |
| [0014](0014-tabelas-comuns-so-do-superadmin.md) | Tabelas Comuns só para o superadmin | Aceita |
| [0015](0015-mysql.md) | MySQL 8.4 como banco de dados | Aceita |
| [0016](0016-frontend-em-vue.md) | Frontend em Vue 3 com shadcn-vue | Aceita |
| [0017](0017-logout-por-inatividade.md) | Logout automático por inatividade | Aceita |

## Como criar um ADR

1. Copie [`template.md`](template.md) para `NNNN-titulo-curto.md`, com o próximo número livre.
2. Preencha e abra o PR junto com a mudança de código, se houver.
3. Adicione a linha na tabela acima.

Um ADR aceito não é reescrito. Se a decisão mudar, crie um ADR novo e marque o antigo como `Substituída por [NNNN](...)`.
