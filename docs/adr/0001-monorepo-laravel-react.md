---
status: aceita
data: 2026-09-21
decisores: equipe ERP para Estudos
---

# Monorepo com API Laravel e SPA React

## Contexto e problema

O sistema precisa de uma interface rica (editor de texto, visualizador de PDF, tabelas, formulários) e de um backend com regras de negócio, relatórios em PDF e multi-tenancy. Como organizar backend e frontend?

## Fatores de decisão

- Interface rica e responsiva.
- Um único lugar para revisar mudanças que atravessam front e back.
- CI que valide as duas partes juntas antes do deploy.

## Opções consideradas

- Monorepo: `backend/` Laravel só API + `frontend/` React SPA
- Laravel com Blade/Livewire (monólito com páginas no servidor)
- Dois repositórios separados

## Decisão

Opção escolhida: **monorepo com API Laravel e SPA React**, porque permite uma interface rica com o ecossistema React (Tiptap, pdf.js, TanStack) mantendo uma única revisão e um único CI para as duas partes.

### Consequências

- Bom, porque uma mudança de API e a tela que a usa entram no mesmo PR.
- Bom, porque o deploy só acontece com os dois jobs de CI verdes.
- Ruim, porque são duas stacks (PHP e Node) para manter atualizadas.
- Ruim, porque o contrato da API precisa ser mantido à mão (veja [referência da API](../referencia/api.md)).

### Confirmação

`ci.yml` tem os jobs `backend` e `frontend`; `deploy.yml` depende dos dois.
