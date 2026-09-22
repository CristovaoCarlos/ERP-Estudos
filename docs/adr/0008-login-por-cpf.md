---
status: aceita
data: 2026-09-22
decisores: equipe STM
---

# Login por CPF no lugar do e-mail

## Contexto e problema

O [ADR-0004](0004-autenticacao-por-token.md) definiu o login por e-mail e senha. Nas prefeituras, o servidor é identificado pelo CPF, e nem todo servidor tem e-mail próprio. Qual dado o usuário deve digitar para entrar?

## Fatores de decisão

- O CPF é o identificador que o servidor já conhece e usa nos outros sistemas da prefeitura.
- O e-mail continua útil para avisos e recuperação de senha no futuro.
- Usuários já cadastrados não podem ser perdidos.

## Opções consideradas

- CPF e senha; o e-mail fica no cadastro, fora da tela de login
- CPF e senha; o e-mail sai do cadastro
- Manter e-mail e senha

## Decisão

Opção escolhida: **CPF e senha, com o e-mail mantido no cadastro**. O login muda sem apagar dados existentes.

- Coluna `users.cpf` (`string(11)`, única), gravada só com dígitos. Anulável no banco para a migration rodar com usuários antigos; a aplicação exige o CPF.
- `POST /api/login` recebe `cpf` (com ou sem máscara) e `password`, e confere os dígitos verificadores (`App\Rules\Cpf`). O erro genérico passa a ser "CPF ou senha inválidos.", e o limite de 5 tentativas por minuto é por CPF + IP.
- `usuarios:criar` recebe `--cpf`. Sem ele, mantém o CPF do usuário existente ou o pede no terminal.
- A tela de login tem o campo CPF com máscara `000.000.000-00` e envia só os dígitos.
- O restante do ADR-0004 (token do Sanctum, vínculo com a prefeitura) continua valendo.

### Consequências

- Bom, porque o servidor entra com um dado que sempre tem.
- Bom, porque nenhum dado é apagado: o e-mail continua no cadastro e em `GET /api/me`.
- Ruim, porque usuários antigos sem CPF não entram até receberem um (`usuarios:criar <email> <nome> --cpf=...`).

### Confirmação

`tests/Feature/AuthTest.php` (login por CPF, com e sem máscara, CPF inválido, e-mail recusado), `tests/Feature/CriarUsuarioTest.php` e `tests/Unit/CpfTest.php`.
