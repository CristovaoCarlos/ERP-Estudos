# STM — Sistema de Tributação Municipal

Monorepo: `backend/` (Laravel 13, API only, multi-tenant por subdomínio) + `frontend/` (React 19 + Vite).

## Desenvolvimento

```bash
cp backend/.env.example backend/.env
docker compose up -d --build
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate

# criar um tenant (o banco é provisionado pelo worker)
docker compose exec app php artisan tinker --execute \
  'App\Models\Tenant::create(["id" => "lemarq"])->domains()->create(["domain" => "lemarq.localhost"]);'

cd frontend && npm ci && npm run dev   # http://lemarq.localhost:5173
```

| Serviço | Endereço |
| ------- | -------- |
| API (nginx) | http://localhost:8000 |
| MariaDB | 127.0.0.1:33061 (root / secret) |
| Mailpit | http://localhost:8025 |

O frontend roda fora do Docker; o Vite faz proxy de `/api` para o backend preservando o header `Host`, que identifica o tenant.

## Qualidade

```bash
docker compose exec app vendor/bin/pint --test
docker compose exec app php artisan test

cd frontend
npm run typecheck && npm run lint && npm run format:check && npm test
```
