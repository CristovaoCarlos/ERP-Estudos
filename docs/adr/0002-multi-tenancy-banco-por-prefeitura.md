---
status: aceita
data: 2026-09-21
decisores: equipe STM
---

# Multi-tenancy com um banco por prefeitura, identificada pelo subdomínio

## Contexto e problema

O STM atende várias prefeituras. Os dados tributários de uma prefeitura não podem vazar para outra. Como isolar os dados de cada cliente?

## Fatores de decisão

- Isolamento forte: um erro de consulta não pode expor dados de outra prefeitura.
- Backup, restauração e exclusão por prefeitura.
- Provisionar prefeitura nova sem trabalho manual.

## Opções consideradas

- Um banco por prefeitura (`stancl/tenancy`, identificação por domínio)
- Banco único com coluna `tenant_id` em todas as tabelas
- Uma instalação do sistema por prefeitura

## Decisão

Opção escolhida: **um banco por prefeitura, identificada pelo subdomínio**, com `stancl/tenancy`.

- Nome do banco: `stm_tenant_<id>` (prefixo em `config/tenancy.php`).
- O banco é criado e migrado **em fila** pelo worker, para não travar quem cria a prefeitura.
- O frontend e o proxy do Vite preservam o header `Host`, que é o que identifica a prefeitura.

### Consequências

- Bom, porque o isolamento é garantido pelo banco, não pela disciplina de cada consulta.
- Bom, porque backup e remoção de uma prefeitura são operações de banco inteiro.
- Ruim, porque migrations de tenant precisam rodar em todos os bancos (`php artisan tenants:migrate`).
- Ruim, porque relatórios que cruzam prefeituras exigem consultar vários bancos.

### Confirmação

Rotas de prefeitura ficam em `routes/tenant.php` com `InitializeTenancyByDomain` e `PreventAccessFromCentralDomains`.

## Mais informações

- <https://tenancyforlaravel.com/docs/v3/>
