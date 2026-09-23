# Como atualizar o ambiente depois de um `git pull`

Código novo pode trazer migrations, dependências, permissões e variáveis de ambiente. Sem aplicá-las, a API responde 500 (ex.: `Undefined column`).

## Atualizar

```bash
bash scripts/atualizar.sh
```

O script, na ordem:

1. Sobe os contêineres (`docker compose up -d`).
2. Lista as variáveis do `backend/.env.example` que faltam no `backend/.env`. Ele **não** as adiciona: copie e ajuste você.
3. Faz backup de todos os bancos em `backups/stm-<data>.sql` (fora do Git). Use `--sem-backup` para pular.
4. `composer install`.
5. `migrate` no banco central e `tenants:migrate` em todas as prefeituras.
6. `acesso:sincronizar` (permissões e grupos padrão).
7. `optimize:clear` e reinício do worker, que mantém o código antigo em memória.
8. Avisa se as dependências do frontend mudaram. Nesse caso, pare o Vite e rode `npm ci` em `frontend/`.

Rodar de novo sem novidades não muda nada. No Windows, rode pelo Git Bash.

## Diagnosticar um erro 500

Para ver se falta migration:

- **Navegador (F12 › Rede):** a resposta da requisição traz a mensagem, com `APP_DEBUG=true`. `SQLSTATE[42703]: Undefined column` ou `42P01: Undefined table` indicam migration pendente.
- **Log do Laravel:** `backend/storage/logs/laravel.log`. O `docker compose logs app` mostra só o status 500, sem o motivo.
- **Status do banco central:** `docker compose exec app php artisan migrate:status` (linhas **Pending**). Para as prefeituras, rode direto `tenants:migrate`: o `tenants:run migrate:status` lê a pasta de migrations errada.
