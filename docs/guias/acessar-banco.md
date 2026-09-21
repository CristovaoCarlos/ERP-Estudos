# Como acessar o banco de dados

O MariaDB do Docker fica acessível só na sua máquina.

| Campo | Valor |
| --- | --- |
| Tipo | MariaDB ou MySQL (TCP/IP) |
| Host | `127.0.0.1` |
| Porta | `33061` |
| Usuário | `root` |
| Senha | `secret` |

## HeidiSQL

1. **Nova sessão** → tipo de rede *MariaDB or MySQL (TCP/IP)*.
2. Preencha os campos da tabela acima e deixe *Bancos de dados* vazio para ver todos.
3. Abrir.

## Linha de comando

```bash
docker compose exec db mariadb -uroot -psecret stm_central
```

## Bancos

| Banco | Conteúdo |
| --- | --- |
| `stm_central` | Prefeituras (`tenants`, `domains`), usuários, vínculos (`tenant_user`), tokens. |
| `stm_tenant_<id>` | Dados de uma prefeitura. |

> **Cuidado:** não rode `php artisan test` apontando para este banco, nem apague tabelas do `stm_central` à mão — a tabela `tenants` guarda o nome do banco de cada prefeitura.

## Backup

```bash
docker compose exec db mariadb-dump -uroot -psecret --all-databases > backup.sql
```
