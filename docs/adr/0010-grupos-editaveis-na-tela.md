---
status: aceita
data: 2026-09-22
decisores: equipe STM
---

# Grupos de acesso montados pela prefeitura, na tela

## Contexto e problema

O [ADR-0009](0009-grupos-de-acesso-e-empresas.md) criou três grupos fixos, um por módulo do menu, definidos em `config/acesso.php` e reescritos por `acesso:sincronizar`. Na prática, uma equipe precisa de telas de módulos diferentes (fiscalização de alvarás usa Parâmetros, Lançamentos e Relatórios), e cada prefeitura se organiza de um jeito. Como deixar o acesso personalizável sem perder a semeadura inicial?

## Fatores de decisão

- Quem conhece a organização da prefeitura é a prefeitura, não o `config`.
- Uma prefeitura nova precisa nascer utilizável, sem depender de cadastro manual.
- Mudança em grupo não pode ser desfeita silenciosamente por um comando de manutenção.

## Opções consideradas

- Grupos só no `config`, editáveis apenas por deploy
- Grupos editáveis na tela, com `acesso:sincronizar` reescrevendo os padrão
- Grupos editáveis na tela, com `acesso:sincronizar` apenas criando os que faltam

## Decisão

Opção escolhida: **grupos editáveis na tela; o comando só cria o que falta**.

- **Administração › Grupos de acesso** (permissão `administracao.grupos`, no lugar de "Papéis e permissões") cria, altera e exclui grupos, marcando tela a tela, agrupadas por módulo do menu.
- `acesso:sincronizar` continua acertando o catálogo de permissões (apagando as que saíram do menu) e **cria apenas os grupos padrão ausentes**; grupos existentes não são tocados.
- `administracao.empresas` fica fora do catálogo e não pode entrar em nenhum grupo: continua exclusiva do superadmin ([ADR-0009](0009-grupos-de-acesso-e-empresas.md)).
- Um grupo com usuários não pode ser excluído; a lista mostra quantos usuários cada grupo tem.
- `GET /api/grupos` atende também ao formulário de usuários, então aceita `administracao.grupos` **ou** `administracao.usuarios`.

### Consequências

- Bom, porque cada prefeitura monta o acesso da própria equipe sem deploy.
- Bom, porque prefeituras novas continuam nascendo com os três grupos por módulo.
- Ruim, porque os grupos passam a divergir entre prefeituras; `config/acesso.php` deixa de descrever o que existe em produção.
- Ruim, porque um grupo padrão excluído volta no próximo `acesso:sincronizar`.

### Confirmação

`tests/Feature/GruposTest.php` (inclusive `test_sincronizar_nao_desfaz_as_mudancas_feitas_na_tela`) e os testes `grupos de acesso` de `frontend/src/App.test.tsx`.
