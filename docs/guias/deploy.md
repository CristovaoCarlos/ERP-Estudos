# Como publicar em produção

O deploy é automático: todo push na `main` dispara `.github/workflows/deploy.yml`.

## Fluxo

1. O workflow chama o CI inteiro (`ci.yml`, via `workflow_call`).
2. Se os jobs `backend` e `frontend` passarem, conecta ao servidor por SSH (`appleboy/ssh-action`) e executa:

```bash
git fetch origin main && git reset --hard origin/main
cd backend
composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader
php artisan migrate --force          # banco central
php artisan tenants:migrate --force  # bancos das prefeituras
php artisan optimize
php artisan queue:restart
cd ../frontend && npm ci && npm run build
sudo systemctl reload php8.4-fpm
```

Se o CI falhar, nada é publicado.

## Configurar (uma vez)

### Segredos no GitHub

Em *Settings → Environments → production*:

| Segredo | Descrição |
| --- | --- |
| `DEPLOY_HOST` | Endereço do servidor. |
| `DEPLOY_USER` | Usuário SSH. |
| `DEPLOY_SSH_KEY` | Chave privada SSH desse usuário. |
| `DEPLOY_PATH` | Pasta do repositório clonado no servidor. |
| `DEPLOY_PORT` | Porta SSH (opcional, padrão 22). |

### Servidor

- PHP 8.4 com as mesmas extensões da imagem de dev (veja [Serviços Docker](../referencia/servicos-docker.md#imagem-php)), `php8.4-fpm`, Composer, Node 22, MySQL 8.4, Redis, nginx.
- Repositório clonado em `DEPLOY_PATH`, com `backend/.env` de produção:
  - `APP_ENV=production`, `APP_DEBUG=false`, `APP_KEY` próprio.
  - `CENTRAL_DOMAINS` com o domínio principal.
  - `DB_CONNECTION=mysql` e usuário de banco próprio (não `root`) com todos os privilégios nos bancos `erp_estudos_*` (como em `docker/mysql/init/01-permissoes.sql`), para criar e excluir os bancos `erp_estudos_tenant_*`.
  - `FILESYSTEM_DISK=s3` e credenciais AWS.
- Worker de fila rodando continuamente (ex.: systemd ou Supervisor com `php artisan queue:work --timeout=300`).
- nginx servindo `frontend/dist` e repassando `/api` ao PHP-FPM, com DNS curinga (`*.dominio`) para os subdomínios das prefeituras.
- O usuário SSH precisa de `sudo` sem senha para `systemctl reload php8.4-fpm`.

> **Atenção:** o deploy faz `git reset --hard`. Qualquer alteração feita direto no servidor é perdida.
