---
status: aceita
data: 2026-09-21
decisores: equipe ERP para Estudos
---

# Usuários e tokens centralizados no erp_estudos_central

## Contexto e problema

Com um banco por prefeitura, onde ficam os usuários? Uma mesma pessoa (ex.: um consultor ou um servidor de consórcio) pode trabalhar em mais de uma prefeitura.

## Opções consideradas

- Usuários e tokens no `erp_estudos_central`, com vínculo explícito usuário ↔ prefeitura
- Usuários no banco de cada prefeitura

## Decisão

Opção escolhida: **usuários e tokens no `erp_estudos_central`**.

- As tabelas `users`, `password_reset_tokens`, `sessions` e `personal_access_tokens` **não existem** nos bancos de prefeitura.
- `User` e `PersonalAccessToken` usam a trait `CentralConnection`, então continuam no banco central mesmo com a prefeitura inicializada.
- O acesso a cada prefeitura é dado pela tabela `tenant_user`.
- Papéis e permissões (`spatie/laravel-permission`) ficam **no banco de cada prefeitura**: o mesmo usuário pode ter papéis diferentes em cada uma.

### Consequências

- Bom, porque a pessoa tem um único login e uma única senha.
- Bom, porque dar ou tirar acesso a uma prefeitura é criar ou apagar um vínculo.
- Ruim, porque todo acesso autenticado precisa checar o vínculo (feito em [ADR-0004](0004-autenticacao-por-token.md)).

### Confirmação

`database/migrations/tenant/` só contém a migration de permissões.
