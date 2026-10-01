---
name: nova-tela
description: Cria uma tela do ERP para Estudos (formulário único de parâmetros ou lista com cadastro, com a API) sobre uma tabela do banco da prefeitura, no padrão do projeto. Use sempre que pedirem uma tela, listagem, formulário ou CRUD novo de um item do menu.
---

# Nova tela

O padrão completo está em `docs/guias/criar-tela.md`. **Leia o guia inteiro antes de escrever código** e siga-o.

## Antes de começar

1. Leia a migration da tabela (`backend/database/migrations/tenant/*create_<tabela>_table.php`) e as tabelas que ela referencia (chaves estrangeiras viram campos de seleção e a rota `opcoes`). Confira também as migrations posteriores que alteram a tabela (ex.: `2026_09_24_120000_remove_id_empresa_do_legado.php`).
2. Escolha o tipo: **formulário único** se a tabela tem um registro por prefeitura (parâmetros), **lista com cadastro** se tem vários. Na dúvida, pergunte ao usuário.
3. Tabela do banco central (`tc_*`, `ti_*`, migrations em `backend/database/migrations/`)? A tela vai em Administração › Tabelas Comuns e é só do superadmin: siga a seção "Tabelas do banco central" do guia (`CentralConnection`, chave `superadmin` em `config/acesso.php`, gate `gerenciar-tabelas-comuns`, `TabelasComunsAcessoTest`; referência Cidades).
4. `id_empresa` e `tb_empresa` não existem (ADR-0013): nunca crie campo, filtro ou coluna de empresa.
5. Ache a tela em `frontend/src/lib/navegacao.ts`: a URL dela define permissão, rotas, nomes de arquivo e `queryKey` (tabela "Nomes" do guia).
6. Leia os arquivos da referência do tipo escolhido.
7. Colunas com significado incerto (siglas do legado): use a sigla como rótulo e avise o usuário no fim, em vez de inventar o significado.

## Checklist

Backend (`docker compose exec app ...`):

- [ ] Model com `TenantConnection` (ou `CentralConnection`), `$table`, `$primaryKey`, `$timestamps = false`, `$guarded` (e `atual()` no formulário único)
- [ ] `<Model>Controller` (`show`/`update` ou `index`/`store`/`update`/`destroy`, mais `opcoes`) com `validar()` que traduz nomes da API → colunas legadas, mensagens em português
- [ ] `<Model>Resource` com `$wrap = null`
- [ ] Rotas em `routes/tenant.php` no grupo `can:<permissao>`
- [ ] `tests/Feature/<Model>Test.php`: 403 sem permissão, caminho feliz completo, regras de validação

Frontend:

- [ ] `src/lib/<modulo>-<tela>.ts` com tipos e hooks
- [ ] `src/pages/<modulo>/<Tela>.tsx` no layout do tipo escolhido
- [ ] Página no mapa `paginas` de `src/App.tsx` (e, se a tela for nova no menu, `navegacao.ts` + `config/acesso.php` + `acesso:sincronizar`)
- [ ] Bloco `describe` em `src/App.test.tsx`

Documentação:

- [ ] `docs/referencia/openapi.yaml` e `docs/referencia/api.md`
- [ ] `CHANGELOG.md` › `Não lançado`

Checagens do CI, mostrando cada comando ao usuário: `pint --test`, `php artisan test`, `typecheck`, `lint`, `format:check`, `test`, `build`.
