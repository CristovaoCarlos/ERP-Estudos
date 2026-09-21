---
status: aceita
data: 2026-09-21
decisores: equipe STM
---

# Frontend roda fora do Docker em desenvolvimento

## Contexto e problema

O backend e seus serviços rodam no Docker Compose. O frontend deve rodar também em contêiner?

## Opções consideradas

- Frontend direto na máquina (Node 22 local), Vite com proxy para o nginx do Compose
- Serviço `frontend` no Docker Compose

## Decisão

Opção escolhida: **frontend fora do Docker**, conforme o levantamento de tecnologias do projeto e preferência da equipe.

- O Vite faz proxy de `/api` para `http://localhost:8000` com `changeOrigin: false`, preservando o `Host` que identifica a prefeitura.
- `VITE_BACKEND_URL` permite apontar o proxy para outro endereço.

### Consequências

- Bom, porque o hot reload e as ferramentas do editor funcionam sem camada extra.
- Ruim, porque cada desenvolvedor precisa ter o Node 22 instalado.
