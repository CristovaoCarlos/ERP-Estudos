---
status: aceita
data: 2026-10-01
decisores: equipe ERP para Estudos
---

# MySQL 8.4 como banco de dados

Substitui o [ADR-0007](0007-postgresql.md).

## Contexto e problema

O [ADR-0007](0007-postgresql.md) padronizou o banco em PostgreSQL 17. A equipe decidiu trocar para MySQL e remover as dependências do PostgreSQL do projeto. Qual banco e versão usar, mantendo um banco por prefeitura ([ADR-0002](0002-multi-tenancy-banco-por-prefeitura.md)), e o que fazer com o SQL próprio do PostgreSQL herdado do legado ([ADR-0012](0012-schema-do-sistema-legado.md))?

## Opções consideradas

- MySQL 8.4 LTS, um banco por prefeitura (`MySQLDatabaseManager`)
- MariaDB 11
- Manter PostgreSQL 17

## Decisão

Opção escolhida: **MySQL 8.4 LTS, um banco por prefeitura**. É a versão de suporte longo do MySQL e tem o que o schema do legado precisa: `CHECK` aplicado de fato, índices por expressão (sobre JSON inclusive) e `DEFAULT` por expressão em `TEXT`.

- Compose: imagem `mysql:8.4`, porta `127.0.0.1:33061`, volume `mysql-data`, usuário `erp_estudos`.
- `docker/mysql/init/01-permissoes.sql` dá ao `erp_estudos` todos os privilégios nos bancos `erp\_estudos\_%`, para criar e excluir os bancos `erp_estudos_tenant_<id>` (a imagem só libera o banco central).
- Imagem PHP com `pdo_mysql` no lugar de `pdo_pgsql` (sem `libpq-dev`).
- `DB_CONNECTION=mysql`; em `config/tenancy.php` ficam só os gerenciadores `sqlite` e `mysql`; a conexão `pgsql` saiu de `config/database.php`.
- Testes continuam em SQLite ([ADR-0006](0006-testes-em-sqlite.md)).
- Migrations da prefeitura ajustadas ao MySQL:
  - `jsonb` vira `json`.
  - Coluna de chave estrangeira com o mesmo tipo da chave referenciada (`unsignedBigInteger` para `bigIncrements`, `unsignedInteger` para `increments`): o MySQL recusa a FK se tamanho ou sinal diferirem, o PostgreSQL aceitava.
  - `tb_parametro_alvara.formula` (`TEXT`) usa default por expressão, `('TAXA')`.
  - Os índices parciais (`WHERE`) e com `INCLUDE` do legado viram índices compostos com a coluna da condição à esquerda. O índice único parcial `uq_processing_iptu_ativo` vira índice único sobre uma expressão `CASE` que dá `NULL` fora da condição, o que mantém a regra "um processamento ativo por lote". Os `CHECK` foram reescritos sem os casts do PostgreSQL.
- Os dados de desenvolvimento foram levados do PostgreSQL para o MySQL (central e prefeituras), depois de um `pg_dumpall` guardado fora do projeto.

### Consequências

- Bom, porque o isolamento por banco continua o mesmo e o código da aplicação não usava SQL próprio do PostgreSQL.
- Bom, porque a colação `utf8mb4_unicode_ci` torna buscas com `LIKE` insensíveis a maiúsculas e acentos sem `ILIKE`/`unaccent`.
- Ruim, porque índices únicos também ficam insensíveis a maiúsculas e acentos: `São Paulo` e `sao paulo` colidem.
- Ruim, porque colunas `timestamp` do MySQL vão só até 2038; datas futuras distantes pedem `dateTime`.
- Ruim, porque índices parciais não existem no MySQL: os índices equivalentes são maiores (indexam todas as linhas).
- Ruim, porque as migrations já executadas foram editadas: bancos PostgreSQL antigos não são compatíveis; o ambiente precisa ser recriado no MySQL.

### Confirmação

`docker compose exec app php -m` lista `pdo_mysql`; criar uma prefeitura gera o banco `erp_estudos_tenant_<id>` no MySQL (`SHOW DATABASES`); `php artisan tenants:migrate` seguido de `tenants:rollback` e novo `tenants:migrate` roda sem erro.
