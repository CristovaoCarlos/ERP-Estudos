# Referência de configuração

## Backend (`backend/.env`)

Copie `backend/.env.example` para `backend/.env`. Os valores abaixo são os de desenvolvimento, apontando para os serviços do Docker Compose.

### Aplicação

| Variável | Padrão (dev) | Descrição |
| --- | --- | --- |
| `APP_NAME` | `STM` | Nome exibido em e-mails e respostas. |
| `APP_ENV` | `local` | `local`, `testing` ou `production`. |
| `APP_KEY` | — | Chave de criptografia. Gere com `php artisan key:generate`. **Nunca versionar.** |
| `APP_DEBUG` | `true` | Mostra detalhes de erro. **`false` em produção.** |
| `APP_URL` | `http://localhost:8000` | URL base do backend. |
| `APP_LOCALE` / `APP_FAKER_LOCALE` | `pt_BR` | Idioma da aplicação e dos dados falsos. |
| `CENTRAL_DOMAINS` | `localhost,127.0.0.1` | Domínios que **não** são prefeituras, separados por vírgula. Em produção, o domínio principal (ex.: `stm.gov.br`). O **primeiro** é a base dos endereços das empresas cadastradas (`<subdomínio>.<primeiro domínio>`). |
| `TENANT_ADMINISTRADOR` | `demo` | Id da prefeitura administradora. Só entrando por ela o superadmin tem acesso total e o cadastro de empresas ([ADR-0009](../adr/0009-grupos-de-acesso-e-empresas.md)). |

### Banco de dados

| Variável | Padrão (dev) | Descrição |
| --- | --- | --- |
| `DB_CONNECTION` | `mysql` | Conexão do banco central. |
| `DB_HOST` / `DB_PORT` | `db` / `3306` | Endereço dentro da rede do Compose. De fora, use `127.0.0.1:33061`. |
| `DB_DATABASE` | `stm_central` | Banco central. |
| `DB_USERNAME` / `DB_PASSWORD` | `stm` / `secret` | O usuário precisa poder **criar e excluir bancos** `stm_tenant_*` (provisionamento de prefeituras). No Compose, `docker/mysql/init/01-permissoes.sql` dá esse privilégio. |

Os bancos das prefeituras usam as mesmas credenciais, com nome `stm_tenant_<id>` (prefixo em `config/tenancy.php`, chave `database.prefix`).

### Cache, sessão e fila

| Variável | Padrão (dev) | Descrição |
| --- | --- | --- |
| `CACHE_STORE` | `redis` | Também usado pelo limite de tentativas de login. |
| `SESSION_DRIVER` | `redis` | |
| `QUEUE_CONNECTION` | `redis` | Fila do provisionamento de prefeituras. |
| `REDIS_HOST` / `REDIS_PORT` | `redis` / `6379` | |

### E-mail

Usado na recuperação de senha. Em desenvolvimento, as mensagens ficam no Mailpit (<http://127.0.0.1:8025>).

| Variável | Padrão (dev) | Descrição |
| --- | --- | --- |
| `MAIL_MAILER` | `smtp` | |
| `MAIL_HOST` / `MAIL_PORT` | `mailpit` / `1025` | Em dev, tudo cai no Mailpit (<http://localhost:8025>). |
| `MAIL_FROM_ADDRESS` | `nao-responda@stm.localhost` | |

### Armazenamento

| Variável | Padrão (dev) | Descrição |
| --- | --- | --- |
| `FILESYSTEM_DISK` | `local` | `s3` em produção. |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_DEFAULT_REGION`, `AWS_BUCKET`, `AWS_USE_PATH_STYLE_ENDPOINT` | vazio | Credenciais do S3 em produção. |

## Testes (`backend/phpunit.xml`)

O `phpunit.xml` define `DB_CONNECTION=sqlite` e `DB_DATABASE=:memory:`, `CACHE_STORE=array`, `QUEUE_CONNECTION=sync`, `SESSION_DRIVER=array` e `MAIL_MAILER=array`. Os bancos de prefeitura criados nos testes viram arquivos SQLite em `backend/database/stm_tenant_*`, apagados ao fim de cada teste. O `tests/TestCase.php` aborta se a conexão não for SQLite ([ADR-0006](../adr/0006-testes-em-sqlite.md)).

## Frontend

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `VITE_BACKEND_URL` | `http://localhost:8000` | Destino do proxy de `/api` no `npm run dev`. Lida pelo `vite.config.ts`. |
| `VITE_CENTRAL_DOMAIN` | `localhost` | Domínio central do frontend. Endereços `<prefeitura>.<VITE_CENTRAL_DOMAIN>` abrem o sistema da prefeitura; qualquer outro abre a landing page. Em produção, o domínio principal (ex.: `stm.gov.br`). |

## Docker Compose

| Variável | Padrão | Descrição |
| --- | --- | --- |
| `HOST_UID` / `HOST_GID` | `1000` | Usuário e grupo do `www-data` na imagem PHP, para os arquivos criados no contêiner pertencerem a você. Use `HOST_UID=$(id -u) HOST_GID=$(id -g) docker compose build`. |
| `DB_USERNAME` / `DB_PASSWORD` / `DB_DATABASE` | `stm` / `secret` / `stm_central` | Usuário, senha e banco criados na **primeira** inicialização do MySQL. A senha do `root` vem de `DB_ROOT_PASSWORD` (padrão `root`). Lidas do ambiente do shell (ou de um `.env` na raiz), não do `backend/.env`. |

## Arquivos de configuração relevantes

| Arquivo | O que define |
| --- | --- |
| `backend/config/tenancy.php` | Modelo `Tenant`, domínios centrais, prefixo dos bancos, bootstrappers. |
| `backend/app/Providers/TenancyServiceProvider.php` | Jobs de criação (em fila) e exclusão do banco da prefeitura. |
| `backend/config/permission.php` | Papéis e permissões (models `App\Models\Role` e `Permission`, na conexão da prefeitura). |
| `backend/config/acesso.php` | Grupos de acesso e catálogo de permissões (uma por tela do menu). |
| `backend/config/filesystems.php` | Disco `fotos` (`storage/app/fotos`), com as fotos dos usuários. Fica fora dos discos isolados por prefeitura, porque o usuário é o mesmo em todas. |
| `backend/config/purifier.php` | Regras de sanitização de HTML. |
| `backend/config/sanctum.php` | Expiração de tokens (padrão: não expiram). |
| `docker/php/php.ini` | Limites do PHP (memória 512M, upload 50M, fuso `America/Sao_Paulo`). |
| `docker/nginx/default.conf` | Servidor web; `client_max_body_size 55M`. |
