---
status: aceita
data: 2026-09-21
decisores: equipe ERP para Estudos
---

# Autenticação por token do Sanctum com vínculo usuário ↔ prefeitura

## Contexto e problema

A SPA precisa autenticar o usuário na API de cada prefeitura. Os usuários são centrais ([ADR-0003](0003-usuarios-centralizados.md)), então um token criado numa prefeitura seria aceito em qualquer outra se nada impedisse.

## Opções consideradas

- Tokens de API do Sanctum (Bearer) + checagem de vínculo em toda rota autenticada
- Sessão com cookie (modo SPA do Sanctum)
- JWT

## Decisão

Opção escolhida: **tokens de API do Sanctum**.

- `POST /api/login` confere senha **e** vínculo com a prefeitura do domínio. Erro genérico ("E-mail ou senha inválidos.") para não revelar se o e-mail existe.
- Limite de 5 tentativas por minuto por e-mail + IP.
- Rotas autenticadas usam `auth:sanctum` + `EnsureUserBelongsToTenant` (403 sem vínculo).
- `POST /api/logout` apaga o token atual.
- O frontend guarda o token no `localStorage` e, em qualquer 401, apaga o token e volta ao login.

### Consequências

- Bom, porque funciona igual em qualquer subdomínio, sem configurar cookies entre domínios.
- Bom, porque o token é revogável na hora (fica no banco).
- Ruim, porque token no `localStorage` fica exposto a XSS; a sanitização do HTML do editor é obrigatória.

### Confirmação

`tests/Feature/AuthTest.php` cobre login, senha errada, usuário sem vínculo, token em prefeitura sem vínculo, logout e limite de tentativas.
