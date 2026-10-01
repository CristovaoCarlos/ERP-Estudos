# ERP para Estudos

Sistema multi-prefeitura: cada prefeitura acessa pelo seu subdomínio e tem banco de dados próprio. Monorepo com `backend/` (Laravel 13, API) e `frontend/` (React 19 + Vite).

## Início rápido

```bash
cp backend/.env.example backend/.env
HOST_UID=$(id -u) HOST_GID=$(id -g) docker compose up -d --build
docker compose exec app composer install
docker compose exec app php artisan key:generate
docker compose exec app php artisan migrate

cd frontend && npm ci && npm run dev
```

Passo a passo completo, com criação de prefeitura e usuário: **[Primeiros passos](docs/tutoriais/primeiros-passos.md)**.

| Serviço | Endereço |
| --- | --- |
| Frontend (fora do Docker) | http://&lt;prefeitura&gt;.localhost:5173 |
| API (nginx) | http://localhost:8000 |
| MySQL 8.4 | 127.0.0.1:33061 (erp_estudos / secret) |
| Mailpit | http://localhost:8025 |

## Qualidade

```bash
docker compose exec app vendor/bin/pint --test
docker compose exec app php artisan test

cd frontend
npm run typecheck && npm run lint && npm run format:check && npm test
```

## Documentação

Toda a documentação está em **[docs/](docs/README.md)**:

- [Tutorial](docs/tutoriais/primeiros-passos.md) · [Guias](docs/README.md) · [Referência da API](docs/referencia/api.md) · [Configuração](docs/referencia/configuracao.md)
- [Arquitetura (arc42)](docs/arquitetura/arc42.md) · [Decisões (ADRs)](docs/adr/README.md)
- [Como contribuir](CONTRIBUTING.md) · [Changelog](CHANGELOG.md)
