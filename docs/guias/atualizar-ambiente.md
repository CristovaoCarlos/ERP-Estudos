# Como atualizar o ambiente depois de um `git pull`

Código novo pode trazer migrations, dependências, permissões e variáveis de ambiente. Sem aplicá-las, a API responde 500 (ex.: `Undefined column`).

Rode os passos na ordem, a partir da raiz do projeto. Rodar de novo sem novidades não muda nada.

## 1. Subir os contêineres

```bash
docker compose up -d
```

## 2. Conferir variáveis novas no `.env`

Liste o que existe no `backend/.env.example` e falta no seu `backend/.env`:

```bash
comm -23 \
  <(grep -oE '^[A-Z_]+=' backend/.env.example | sort -u) \
  <(grep -oE '^[A-Z_]+=' backend/.env | sort -u)
```

Para cada variável listada, copie a linha correspondente do `.env.example` para o `.env` e ajuste o valor. O significado de cada uma está em [Configuração (.env)](../referencia/configuracao.md).

## 3. Backup do banco

Antes de qualquer migration. A pasta `backups/` está no `.gitignore`.

```bash
mkdir -p backups
docker compose exec -T db sh -c 'mysqldump -uroot -p"$MYSQL_ROOT_PASSWORD" --all-databases --single-transaction --routines' > "backups/erp_estudos-$(date +%Y%m%d-%H%M%S).sql"
```

## 4. Dependências do backend

```bash
docker compose exec app composer install
```

## 5. Migrations

Primeiro o banco central, depois todas as prefeituras:

```bash
docker compose exec app php artisan migrate --force
docker compose exec app php artisan tenants:migrate --force
```

## 6. Permissões e grupos padrão

```bash
docker compose exec app php artisan acesso:sincronizar
```

Telas novas entram no catálogo de permissões e no grupo `Administrador` de cada prefeitura. Grupos já existentes não são alterados.

## 7. Limpar caches e reiniciar o worker

O worker mantém o código antigo em memória: reiniciar não é opcional.

```bash
docker compose exec app php artisan optimize:clear
docker compose restart worker
```

## 8. Frontend

Só é preciso se o `frontend/package-lock.json` mudou no pull. Pare o Vite antes:

```bash
cd frontend && npm ci && npm run dev
```

## Se algo der errado

**502 no nginx**, depois de o contêiner `app` ser recriado:

```bash
docker compose restart nginx
```

**500 na API**, quase sempre migration pendente. Para confirmar:

- **Navegador (F12 › Rede):** com `APP_DEBUG=true`, a resposta traz a mensagem. `SQLSTATE[42703]: Undefined column` ou `42P01: Undefined table` indicam migration pendente.
- **Log do Laravel:** `backend/storage/logs/laravel.log`. O `docker compose logs app` mostra só o status 500, sem o motivo.
- **Status do banco central:** `docker compose exec app php artisan migrate:status` (linhas **Pending**). Para as prefeituras, rode direto o `tenants:migrate` do passo 5: o `tenants:run migrate:status` lê a pasta de migrations errada.
