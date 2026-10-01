# Serviços do Docker Compose

Projeto Compose: `erp_estudos` (contêineres `erp_estudos-<serviço>-1`). Todas as portas são publicadas **apenas em `127.0.0.1`**.

| Serviço | Imagem | Porta no host | Papel |
| --- | --- | --- | --- |
| `app` | `erp_estudos-php:dev` (build de `docker/php/Dockerfile`, base `php:8.4-fpm`) | — | API Laravel (PHP-FPM na porta interna 9000). |
| `worker` | `erp_estudos-php:dev` | — | `php artisan queue:work --timeout=300 --tries=1`: provisionamento de prefeituras. |
| `nginx` | `nginx:1.27-alpine` | `8000` | Servidor web; repassa `.php` ao `app`. |
| `db` | `mysql:8.4` | `33061` | Bancos `erp_estudos_central` e `erp_estudos_tenant_*`. Na primeira inicialização roda `docker/mysql/init/`, que dá ao `erp_estudos` acesso aos bancos `erp_estudos_*`. |
| `redis` | `redis:7-alpine` | — | Cache, sessão e fila. |
| `mailpit` | `axllent/mailpit:v1.21` | `8025` (web), `1025` (SMTP) | Caixa de e-mail de desenvolvimento. |

O frontend **não** roda no Compose ([ADR-0005](../adr/0005-frontend-fora-do-docker.md)).

## Volumes

| Volume / montagem | Conteúdo |
| --- | --- |
| `./backend` → `/var/www/html` (`app`, `worker`) | Código do backend; mudanças aparecem na hora. |
| `./backend/public` → nginx (somente leitura) | Arquivos públicos. |
| `mysql-data` | Dados do MySQL. Apagado por `docker compose down -v`. |
| `./docker/mysql/init` → `db` (somente leitura) | Scripts SQL da primeira inicialização do MySQL. |
| `redis-data` | Dados do Redis. |

## Imagem PHP

`docker/php/Dockerfile`:

- Extensões: `pdo_mysql`, `mbstring`, `zip`, `gd` (com FreeType e JPEG), `intl`, `bcmath`, `pcntl`, `opcache`, `exif` e `redis` (PECL).
- Composer 2 incluído.
- `www-data` recebe o UID/GID do host (`HOST_UID`/`HOST_GID`), para os arquivos gerados pertencerem ao seu usuário.
- Configuração extra em `docker/php/php.ini`.

## Observações

- O `backend/.env` **não** é passado como `env_file`: o Laravel o lê do diretório montado. Isso permite ao `phpunit.xml` trocar o banco para SQLite nos testes ([ADR-0006](../adr/0006-testes-em-sqlite.md)).
- `db` tem healthcheck; `app` e `worker` só sobem com o banco pronto.
- Se o `app` for recriado e o nginx responder **502**, rode `docker compose restart nginx` (o nginx guarda o IP antigo).
