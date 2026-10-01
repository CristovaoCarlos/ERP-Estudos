# Como criar uma prefeitura (tenant)

## Criar pela tela (recomendado)

Entre como superadmin em `demo.<domínio>` e abra **Administração › Empresas › Nova empresa**. Informe nome, CNPJ e endereço (subdomínio). O sistema cria o tenant e o domínio, e o worker cria o banco, roda as migrations e cria os grupos de acesso. A empresa aparece como **Provisionando** até o banco ficar pronto e depois como **Ativa**.

- **Endereço:** `nova-esperanca` vira o domínio `nova-esperanca.<primeiro CENTRAL_DOMAINS>` e o tenant `nova_esperanca` (banco `stm_tenant_nova_esperanca`). Não pode ser alterado depois.
- **CNPJ:** numérico ou alfanumérico, conferido pelos dígitos verificadores. Não pode repetir.
- **Administrador:** informe CPF, e-mail e senha inicial. O sistema cria o usuário `admin_<subdomínio>` no grupo Administrador, com acesso a todas as telas da prefeitura nova. Se o CPF já existir no STM, o usuário atual é aproveitado (nome e senha dele são mantidos) e passa a ter acesso também a esta prefeitura.

A API equivalente é `POST /api/empresas` (veja a [referência da API](../referencia/api.md)).

## Criar pelo terminal

```bash
docker compose exec app php artisan tinker --execute \
  'App\Models\Tenant::create(["id" => "prefeitura_teste"])->domains()->create(["domain" => "prefeitura-teste.localhost"]);'
```

- **Id:** letras minúsculas, números e `_`. Vira o nome do banco: `stm_tenant_prefeitura_teste`.
- **Domínio:** use **hífen**, não underline — hostnames não aceitam `_`. Em produção, o subdomínio real (ex.: `prefeitura-teste.stm.gov.br`).

O banco é criado e migrado pelo worker, em segundo plano, e recebe os grupos de acesso. Informe `nome` e `cnpj` no `create` para a prefeitura aparecer com nome em Empresas.

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
