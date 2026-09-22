# Como criar uma prefeitura (tenant)

## Criar

```bash
docker compose exec app php artisan tinker --execute \
  'App\Models\Tenant::create(["id" => "prefeitura_teste"])->domains()->create(["domain" => "prefeitura-teste.localhost"]);'
```

- **Id:** letras minúsculas, números e `_`. Vira o nome do banco: `stm_tenant_prefeitura_teste`.
- **Domínio:** use **hífen**, não underline — hostnames não aceitam `_`. Em produção, o subdomínio real (ex.: `prefeitura-teste.stm.gov.br`).

O banco é criado e migrado pelo worker, em segundo plano.

## Conferir

```bash
docker compose exec app php artisan tenants:list
curl -H 'Host: prefeitura-teste.localhost' http://127.0.0.1:8000/api/tenant
```

Se o banco não aparecer, veja o worker: `docker compose logs worker`.

## Dar acesso a usuários

```bash
docker compose exec app php artisan usuarios:criar fulano@exemplo.com "Fulano" --cpf=<cpf> --tenant=prefeitura_teste
```

Veja [Criar e vincular usuários](gerenciar-usuarios.md).

## Adicionar outro domínio à mesma prefeitura

```bash
docker compose exec app php artisan tinker --execute \
  'App\Models\Tenant::find("prefeitura_teste")->domains()->create(["domain" => "outro-endereco.localhost"]);'
```

## Remover uma prefeitura

> **Atenção:** apaga o banco da prefeitura com todos os dados. Faça backup antes.

```bash
docker compose exec app php artisan tinker --execute 'App\Models\Tenant::find("prefeitura_teste")->delete();'
```
