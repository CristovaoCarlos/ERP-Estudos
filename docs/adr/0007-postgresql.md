---
status: aceita
data: 2026-09-22
decisores: equipe STM
---

# PostgreSQL 17 como banco de dados

## Contexto e problema

O projeto começou com MariaDB 11 em desenvolvimento e produção. A equipe decidiu padronizar o banco em PostgreSQL. Qual banco e versão usar, mantendo um banco por prefeitura ([ADR-0002](0002-multi-tenancy-banco-por-prefeitura.md))?

## Opções consideradas

- PostgreSQL 17, um **banco** por prefeitura (`PostgreSQLDatabaseManager`)
- PostgreSQL 17, um **schema** por prefeitura (`PostgreSQLSchemaManager`)
- Manter MariaDB 11

## Decisão

Opção escolhida: **PostgreSQL 17, um banco por prefeitura**, que troca o motor sem mudar o isolamento definido no ADR-0002.

- Compose: imagem `postgres:17-alpine`, porta `127.0.0.1:54321`, volume `pg-data`, superusuário `stm`.
- Imagem PHP com `pdo_pgsql` no lugar de `pdo_mysql`.
- `DB_CONNECTION=pgsql`; em `config/tenancy.php` só ficam os gerenciadores `sqlite` e `pgsql`.
- Testes continuam em SQLite ([ADR-0006](0006-testes-em-sqlite.md)); a trava do `TestCase` vale igual para `pgsql`.

### Consequências

- Bom, porque o PostgreSQL tem tipos e recursos mais ricos (JSONB, índices parciais, `CHECK`) e é o padrão da equipe.
- Bom, porque o isolamento por banco continua o mesmo; migrations não precisaram mudar.
- Ruim, porque `DROP DATABASE` falha se houver conexão aberta no banco da prefeitura; ferramentas como DBeaver precisam ser desconectadas antes de excluir uma prefeitura.
- Ruim, porque os dados do MariaDB de desenvolvimento não foram migrados (o volume `stm_db-data` foi mantido, mas não é mais usado).

### Confirmação

`docker compose exec app php -m` lista `pdo_pgsql`; criar uma prefeitura gera o banco `stm_tenant_<id>` no PostgreSQL (`\l` no `psql`).
