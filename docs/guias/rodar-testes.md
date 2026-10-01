# Como rodar testes e checagens

As mesmas checagens do CI (`.github/workflows/ci.yml`). Rode antes de abrir um PR.

## Backend

```bash
docker compose exec app vendor/bin/pint --test   # formatação (sem --test, corrige)
docker compose exec app php artisan test         # PHPUnit
```

Um teste específico:

```bash
docker compose exec app php artisan test --filter=AuthTest
```

Os testes rodam em **SQLite**, nunca no MySQL. Se aparecer `Testes devem rodar em SQLite`, algo está forçando `DB_CONNECTION` no ambiente — veja [ADR-0006](../adr/0006-testes-em-sqlite.md).

## Frontend

```bash
cd frontend
npm run typecheck      # tsc -b
npm run lint           # ESLint
npm run format:check   # Prettier (npm run format corrige)
npm test               # Vitest
npm run build          # build de produção
```

## Escrevendo testes

- **Backend, rotas de prefeitura:** crie a prefeitura no teste e chame a URL com o domínio dela, como em `tests/Feature/AuthTest.php`:

  ```php
  $tenant = Tenant::create(['id' => 'lemarq']);
  $tenant->domains()->create(['domain' => 'lemarq.localhost']);

  $this->getJson('http://lemarq.localhost/api/tenant')->assertOk();
  ```

  Apague a prefeitura no `tearDown` (isso remove o arquivo SQLite dela) e chame `tenancy()->end()`.

- **Frontend:** o jsdom roda em `http://lemarq.localhost:5173`. Faça mock de `api.get`/`api.post` com `vi.spyOn`, como em `src/App.test.tsx`.
