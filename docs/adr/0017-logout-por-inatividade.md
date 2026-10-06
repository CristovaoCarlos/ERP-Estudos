---
status: aceita
data: 2026-10-06
decisores: equipe ERP para Estudos
---

# Logout automático por inatividade

## Contexto e problema

O token do Sanctum não expirava ([ADR-0004](0004-autenticacao-por-token.md)): uma sessão aberta num computador de prefeitura ficava válida até alguém clicar em **Sair**. Como encerrar a sessão de quem se afastou, sem derrubar quem está usando o sistema?

## Fatores de decisão

- Um token copiado do `localStorage` não pode continuar valendo para sempre.
- Quem preenche um formulário longo, sem fazer requisições, está usando o sistema.
- Várias abas abertas são uma sessão só.
- Abas em segundo plano têm timers reduzidos pelo navegador, e o computador pode hibernar.

## Opções consideradas

- Só no frontend: timer no navegador e logout.
- Frontend e backend: o servidor também recusa o token ocioso.
- `expiration` do Sanctum (validade fixa desde a criação do token).

## Decisão

Opção escolhida: **frontend e backend**, com o prazo em `SESSAO_INATIVIDADE_MINUTOS` (padrão 5, em `config/sessao.php`).

- **Backend:** `Sanctum::authenticateAccessTokensUsing` (em `AppServiceProvider`) recusa e apaga o token cujo `last_used_at` (ou `created_at`, se nunca usado) é mais antigo que o prazo. O Sanctum chama o callback antes de atualizar o `last_used_at`, então ele enxerga o uso anterior. O prazo vai ao frontend no campo `inatividade_minutos` de `/api/login` e `/api/me`.
- **Frontend (`src/lib/sessao.ts`, ligado pela `RotaProtegida`):**
  - Mouse, teclado, toque e rolagem registram a atividade, que vai para o `localStorage` e vale para todas as abas.
  - Se o usuário está ativo, mas a última requisição já passou da metade do prazo, o frontend chama `POST /api/sessao/renovar`. Não há requisição periódica: sem atividade, nada é enviado.
  - Uma checagem por horário a cada segundo, e ao voltar para a aba, encerra a sessão quando o prazo se esgota: revoga o token (`POST /api/logout`), limpa o cache e abre `/login?sessao=inatividade`, guardando a tela para voltar a ela depois do login.
  - Um 401 do servidor leva a `/login?sessao=expirada`.
- **Sem aviso prévio:** a sessão cai direto, e o login explica o motivo.

### Consequências

- Bom, porque o token ocioso deixa de valer no servidor, e não só na tela.
- Bom, porque digitar sem salvar não derruba a sessão, e a renovação só gera tráfego quando há uso.
- Bom, porque conferir por horário funciona com a aba em segundo plano ou depois de o computador hibernar.
- Ruim, porque requisições automáticas (o acompanhamento do provisionamento em Empresas, a cada 3 s) mantêm o token vivo no servidor enquanto duram. A tela, que decide pela atividade do usuário, desloga do mesmo jeito e revoga o token.
- Ruim, porque quem fica mais de 5 minutos só lendo, sem mexer o mouse, é deslogado.

### Confirmação

`tests/Feature/SessaoTest.php` cobre o token dentro e fora do prazo, o token nunca usado, o prazo configurável e a renovação. `src/App.test.ts` ("sessão por inatividade") cobre o logout aos 5 minutos, o adiamento por atividade, a sincronização entre abas e os avisos do login.

## Prós e contras das opções

### Só no frontend

- Bom, porque é mais simples.
- Ruim, porque o token continua válido no servidor até o logout explícito.

### `expiration` do Sanctum

- Bom, porque é só configuração.
- Ruim, porque conta o tempo desde o login, não desde o último uso: derruba quem está trabalhando.
