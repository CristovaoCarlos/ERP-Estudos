---
status: aceita
data: 2026-09-24
decisores: equipe STM
---

# Tabelas Comuns só para o superadmin

## Contexto e problema

As Tabelas Comuns (cidades, bancos, CNAE, lista de serviços da LC 116, SELIC, segmentos, numeração de notas e tipos de DAM) ficam no banco central ([ADR-0012](0012-schema-do-sistema-legado.md)) e valem para todas as prefeituras. Com as telas ganhando inclusão e alteração, a regra de acesso por grupo ([ADR-0010](0010-grupos-editaveis-na-tela.md)) deixaria qualquer prefeitura mudar dados que as outras usam: o grupo `Administrador` existe em toda prefeitura, o `admin_<prefeitura>` de cada cliente está nele ([ADR-0011](0011-grupo-administrador-e-admin-da-prefeitura.md)), e a tela Grupos de acesso permitia dar essas telas a qualquer grupo.

## Fatores de decisão

- Uma alteração feita por um cliente não pode mudar o que os outros clientes usam.
- Quem mantém as tabelas de referência é a mantenedora do STM, que já tem o superadmin e a tela Empresas.
- O mecanismo precisa valer no backend (rotas) e no frontend (menu e tela de grupos).

## Opções consideradas

- Manter as permissões por grupo (qualquer grupo pode receber as telas)
- Restringir ao grupo `Administrador` de cada prefeitura
- Restringir ao superadmin, na prefeitura administradora (`TENANT_ADMINISTRADOR`), como Empresas

## Decisão

Opção escolhida: "restringir ao superadmin", porque é a única em que nenhum cliente altera dado de outro.

- As permissões das telas (`administracao.tabelas-comuns.*`) saem do catálogo de grupos e vão para a chave `superadmin` de `config/acesso.php`, ao lado de Empresas (`Acesso::exclusivasDoSuperadmin()`). Nenhum grupo as recebe, nem o `Administrador`, e a tela Grupos de acesso não as oferece.
- Todas as rotas `/api/administracao/tabelas-comuns/*` ficam atrás do gate `gerenciar-tabelas-comuns`, que só o superadmin, entrando pela prefeitura administradora, passa.
- No menu, o submenu Tabelas Comuns fica em Administração, abaixo de Empresas, e só aparece para quem recebe essas permissões no `/me`, ou seja, o superadmin.

### Consequências

- Bom, porque os dados centrais só mudam por uma pessoa, na prefeitura administradora.
- Bom, porque segue o mecanismo que Empresas já usava: nada novo para entender.
- Ruim, porque um cliente que precisar de uma cidade ou de um banco novo depende da mantenedora do STM para cadastrar.

### Confirmação

`TabelasComunsAcessoTest` confere que o `Administrador` de uma prefeitura e o superadmin fora da prefeitura administradora recebem 403 em todas as rotas do módulo, que o superadmin na prefeitura administradora passa, e que a tela de grupos recusa essas telas.
