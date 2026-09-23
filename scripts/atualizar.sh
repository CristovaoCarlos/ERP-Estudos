#!/usr/bin/env bash
# Atualiza o ambiente de desenvolvimento depois de um `git pull`:
# dependências, migrations (central e prefeituras), permissões e worker.
# Pode rodar quantas vezes quiser: sem novidades, nada muda.
#
# Uso: bash scripts/atualizar.sh [--sem-backup]
set -euo pipefail

cd "$(dirname "$0")/.."

backup=1
[[ "${1:-}" == "--sem-backup" ]] && backup=0

passo() { printf '\n\033[1;34m==> %s\033[0m\n' "$*"; }
aviso() { printf '\033[1;33m%s\033[0m\n' "$*"; }
artisan() { docker compose exec -T app php artisan "$@"; }

if ! docker info >/dev/null 2>&1; then
    echo "O Docker não está rodando. Abra o Docker Desktop e tente de novo." >&2
    exit 1
fi

if [[ ! -f backend/.env ]]; then
    echo "backend/.env não existe. Veja docs/tutoriais/primeiros-passos.md." >&2
    exit 1
fi

passo "Subindo os contêineres"
docker compose up -d

passo "Conferindo variáveis do .env"
faltando=$(comm -23 \
    <(grep -oE '^[A-Z_]+=' backend/.env.example | sort -u) \
    <(grep -oE '^[A-Z_]+=' backend/.env | sort -u) | tr -d '=')
if [[ -n "$faltando" ]]; then
    aviso "Variáveis do .env.example que faltam no backend/.env (copie e ajuste):"
    for var in $faltando; do grep -E "^$var=" backend/.env.example | sed 's/^/  /'; done
else
    echo "Nenhuma variável faltando."
fi

if (( backup )); then
    passo "Backup do banco"
    mkdir -p backups
    arquivo="backups/stm-$(date +%Y%m%d-%H%M%S).sql"
    docker compose exec -T db pg_dumpall -U stm > "$arquivo"
    echo "Salvo em $arquivo"
fi

passo "Dependências do backend (composer install)"
docker compose exec -T app composer install --no-interaction

passo "Migrations do banco central"
artisan migrate --force

passo "Migrations dos bancos das prefeituras"
artisan tenants:migrate --force

passo "Permissões e grupos padrão"
artisan acesso:sincronizar

passo "Limpando caches"
artisan optimize:clear

passo "Reiniciando o worker (ele guarda o código antigo em memória)"
docker compose restart worker

lock=frontend/package-lock.json
instalado=frontend/node_modules/.package-lock.json
if [[ ! -f "$instalado" || "$lock" -nt "$instalado" ]]; then
    aviso "As dependências do frontend mudaram: pare o Vite e rode 'npm ci' em frontend/."
fi

passo "Pronto"
