# Referência de comandos

Comandos do backend rodam dentro do contêiner: `docker compose exec app <comando>`.

## Comandos do projeto

### `usuarios:criar`

Cria um usuário no `erp_estudos_central` (ou atualiza nome, CPF e senha, se o e-mail já existir) e o vincula às prefeituras informadas. Vínculos existentes são mantidos.

```
php artisan usuarios:criar {email} {nome} [--cpf=CPF] [--tenant=ID ...] [--grupo=GRUPO ...] [--superadmin] [--senha=SENHA]
```

| Argumento / opção | Descrição |
| --- | --- |
| `email` | E-mail do usuário. Identifica o cadastro a criar ou atualizar. |
| `nome` | Nome exibido. |
| `--cpf` | CPF usado no login, com ou sem máscara (gravado só com dígitos). Se omitido, mantém o CPF do usuário existente ou é pedido no terminal. Falha se for inválido ou já pertencer a outro usuário. |
| `--tenant` | Id da prefeitura. Repita para várias. Falha se alguma não existir. |
| `--grupo` | Grupo de acesso (ex.: `Parâmetros`, `Tabelas`, `Lançamentos`) dado em **cada** prefeitura de `--tenant`. Repita para vários. Grupos que o usuário já tem são mantidos. Exige `--tenant`; falha se o grupo não existir na prefeitura. |
| `--superadmin` | Marca o usuário como superadmin. Só tem efeito quando ele entra pela prefeitura `TENANT_ADMINISTRADOR`. |
| `--senha` | Senha. Se omitida, é pedida sem eco no terminal (recomendado). |

### `acesso:sincronizar`

Acerta, no banco de cada prefeitura, as permissões de `config/acesso.php` (uma por tela) e **cria os grupos padrão que não existirem**. Permissões fora do catálogo são apagadas. Grupos existentes **não são alterados**: quem manda neles é a tela Administração › Grupos de acesso ([ADR-0010](../adr/0010-grupos-editaveis-na-tela.md)). Rode depois de mudar o catálogo (tela nova no menu). Prefeituras novas já recebem tudo no provisionamento.

```
php artisan acesso:sincronizar [--tenant=ID ...]
```

| Opção | Descrição |
| --- | --- |
| `--tenant` | Id da prefeitura. Repita para várias. Sem a opção, todas. |

## Comandos de prefeituras (`stancl/tenancy`)

| Comando | Descrição |
| --- | --- |
| `php artisan tenants:list` | Lista prefeituras e domínios. |
| `php artisan tenants:migrate` | Roda as migrations de `database/migrations/tenant` em todas as prefeituras. |
| `php artisan tenants:migrate --tenants=demo` | Só em uma prefeitura. |
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
