# Como acessar o banco de dados

O MySQL 8.4 do Docker fica acessível só na sua máquina.

| Campo | Valor |
| --- | --- |
| Tipo | MySQL |
| Host | `127.0.0.1` |
| Porta | `33061` |
| Usuário | `stm` |
| Senha | `secret` |
| Banco | `stm_central` (ou `stm_tenant_<id>`) |

## DBeaver / MySQL Workbench / HeidiSQL

1. Nova conexão do tipo *MySQL*.
2. Preencha os campos da tabela acima. No DBeaver, se aparecer `Public Key Retrieval is not allowed`, ative `allowPublicKeyRetrieval` nas propriedades do driver.
3. Conectar.

## Linha de comando

```bash
docker compose exec db mysql -ustm -psecret stm_central
```

Liste os bancos com `SHOW DATABASES;` e troque de banco com `USE stm_tenant_<id>;`.

## Bancos

| Banco | Conteúdo |
| --- | --- |
| `stm_central` | Prefeituras (`tenants`, `domains`), usuários, vínculos (`tenant_user`), tokens. |
| `stm_tenant_<id>` | Dados de uma prefeitura. |

> **Cuidado:** não rode `php artisan test` apontando para este banco, nem apague tabelas do `stm_central` à mão — a tabela `tenants` guarda o nome do banco de cada prefeitura.

## Backup

```bash
docker compose exec -T db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases --single-transaction --routines' > backup.sql
```

Para restaurar:

```bash
docker compose exec -T db sh -c 'mysql -uroot -p"$MYSQL_ROOT_PASSWORD"' < backup.sql
```
