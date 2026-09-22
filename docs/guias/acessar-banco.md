# Como acessar o banco de dados

O PostgreSQL 17 do Docker fica acessível só na sua máquina.

| Campo | Valor |
| --- | --- |
| Tipo | PostgreSQL |
| Host | `127.0.0.1` |
| Porta | `54321` |
| Usuário | `stm` |
| Senha | `secret` |
| Banco | `stm_central` (ou `stm_tenant_<id>`) |

## DBeaver / pgAdmin / HeidiSQL

1. Nova conexão do tipo *PostgreSQL*.
2. Preencha os campos da tabela acima. No DBeaver, marque *Show all databases* para ver os bancos das prefeituras.
3. Conectar.

> Feche a conexão com o banco de uma prefeitura antes de excluí-la: o PostgreSQL não apaga um banco com conexões abertas.

## Linha de comando

```bash
docker compose exec db psql -U stm stm_central
```

Liste os bancos com `\l` e troque de banco com `\c stm_tenant_<id>`.

## Bancos

| Banco | Conteúdo |
| --- | --- |
| `stm_central` | Prefeituras (`tenants`, `domains`), usuários, vínculos (`tenant_user`), tokens. |
| `stm_tenant_<id>` | Dados de uma prefeitura. |

> **Cuidado:** não rode `php artisan test` apontando para este banco, nem apague tabelas do `stm_central` à mão — a tabela `tenants` guarda o nome do banco de cada prefeitura.

## Backup

```bash
docker compose exec db pg_dumpall -U stm > backup.sql
```

Para restaurar num banco vazio:

```bash
docker compose exec -T db psql -U stm -d postgres < backup.sql
```
