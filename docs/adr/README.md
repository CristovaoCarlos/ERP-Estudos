# Decisões de arquitetura (ADRs)

Cada decisão de arquitetura relevante é registrada aqui, no formato [MADR](https://adr.github.io/madr/) (Markdown Architectural Decision Records).

| Nº | Decisão | Status |
| --- | --- | --- |
| [0000](0000-registrar-decisoes-com-madr.md) | Registrar decisões de arquitetura com MADR | Aceita |
| [0001](0001-monorepo-laravel-react.md) | Monorepo com API Laravel e SPA React | Aceita |
| [0002](0002-multi-tenancy-banco-por-prefeitura.md) | Multi-tenancy com um banco por prefeitura, identificada pelo subdomínio | Aceita |
| [0003](0003-usuarios-centralizados.md) | Usuários e tokens centralizados no `stm_central` | Aceita |
| [0004](0004-autenticacao-por-token.md) | Autenticação por token do Sanctum com vínculo usuário ↔ prefeitura | Aceita |
| [0005](0005-frontend-fora-do-docker.md) | Frontend roda fora do Docker em desenvolvimento | Aceita |
| [0006](0006-testes-em-sqlite.md) | Testes em SQLite, com trava contra o banco real | Aceita |

## Como criar um ADR

1. Copie [`template.md`](template.md) para `NNNN-titulo-curto.md`, com o próximo número livre.
2. Preencha e abra o PR junto com a mudança de código, se houver.
3. Adicione a linha na tabela acima.

Um ADR aceito não é reescrito. Se a decisão mudar, crie um ADR novo e marque o antigo como `Substituída por [NNNN](...)`.
