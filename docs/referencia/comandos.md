# Referência de comandos

Comandos do backend rodam dentro do contêiner: `docker compose exec app <comando>`.

## Comandos do projeto

### `usuarios:criar`

Cria um usuário no `stm_central` (ou atualiza nome e senha, se o e-mail já existir) e o vincula às prefeituras informadas. Vínculos existentes são mantidos.

```
php artisan usuarios:criar {email} {nome} [--tenant=ID ...] [--senha=SENHA]
```

| Argumento / opção | Descrição |
| --- | --- |
| `email` | E-mail do usuário (login). |
| `nome` | Nome exibido. |
| `--tenant` | Id da prefeitura. Repita para várias. Falha se alguma não existir. |
| `--senha` | Senha. Se omitida, é pedida sem eco no terminal (recomendado). |

## Comandos de prefeituras (`stancl/tenancy`)

| Comando | Descrição |
| --- | --- |
| `php artisan tenants:list` | Lista prefeituras e domínios. |
| `php artisan tenants:migrate` | Roda as migrations de `database/migrations/tenant` em todas as prefeituras. |
| `php artisan tenants:migrate --tenants=lemarq` | Só em uma prefeitura. |
| `php artisan tenants:rollback` | Desfaz a última migration das prefeituras. |
| `php artisan tenants:seed` | Roda seeders nas prefeituras. |
| `php artisan tenants:run <comando>` | Roda um comando artisan no contexto de cada prefeitura. |

## Comandos gerais do backend

| Comando | Descrição |
| --- | --- |
| `php artisan migrate` | Migrations do banco central. |
| `php artisan test` | Suíte PHPUnit (SQLite). |
| `vendor/bin/pint` | Formata o código PHP. `--test` só verifica (usado no CI). |
| `php artisan route:list --except-vendor` | Lista as rotas. |
| `php artisan tinker` | Console interativo. |
| `php artisan pail` | Logs em tempo real. |
| `php artisan queue:restart` | Reinicia o worker após mudar código de jobs. |

## Frontend (`frontend/`)

| Comando | Descrição |
| --- | --- |
| `npm ci` | Instala as dependências exatamente como no `package-lock.json`. |
| `npm run dev` | Servidor de desenvolvimento em `:5173`, com proxy de `/api`. |
| `npm run build` | Checagem de tipos + build de produção em `dist/`. |
| `npm run typecheck` | `tsc -b`. |
| `npm run lint` | ESLint. |
| `npm run format` / `format:check` | Prettier (formatar / só verificar). |
| `npm test` | Vitest, uma execução. `npm run test:watch` para modo contínuo. |

## Docker Compose (raiz)

| Comando | Descrição |
| --- | --- |
| `docker compose up -d --build` | Sobe (e reconstrói) todos os serviços. |
| `docker compose ps` | Estado dos serviços. |
| `docker compose logs -f worker` | Acompanha o worker (provisionamento). |
| `docker compose restart nginx` | Necessário se o contêiner `app` for recriado e o nginx responder 502. |
| `docker compose down` | Para tudo, mantendo os dados. |
| `docker compose down -v` | Para tudo e **apaga os dados** (bancos e Redis). |
