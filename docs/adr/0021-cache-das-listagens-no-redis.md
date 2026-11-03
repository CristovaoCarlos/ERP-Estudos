---
status: aceita
data: 2026-10-06
decisores: equipe ERP para Estudos
---

# Cache das listagens no Redis, com validade de 5 minutos

## Contexto e problema

As telas de listagem (Lançamentos › Vendas, Cadastros › Clientes, Produtos e Vendedores) recebem a lista inteira da API e filtram no navegador (`Listagem.vue`). A cada abertura da tela o backend consulta o banco da prefeitura e monta o JSON, e a lista de vendas ainda carrega cliente, vendedor e itens. Como evitar repetir essa consulta a cada abertura, sem mostrar dados velhos depois de uma alteração?

## Fatores de decisão

- Menos consultas ao banco nas telas mais abertas.
- Depois de gravar, a lista mostra o que foi gravado.
- Uma prefeitura nunca vê o cache da outra.
- O Redis já está no ambiente (cache, sessão e fila).

## Opções consideradas

- Cache da resposta no Redis por 5 minutos, limpo por quem altera os dados.
- Cache só por tempo (5 minutos), sem limpeza.
- Sem cache no servidor; só o do vue-query no navegador.

## Decisão

Opção escolhida: **cache no Redis por 5 minutos, limpo nas alterações** (`App\Support\CacheDeListagens`).

- O `index` de cada listagem guarda o JSON já montado (`Resource::collection(...)->resolve()`) com `Cache::remember` por 300 segundos. A resposta da API não muda.
- As chaves (`listagens.vendas`, `listagens.clientes`, ...) não levam a prefeitura: o `CacheTenancyBootstrapper` do stancl/tenancy marca cada chave com a tag `tenant_<id>`.
- Os eventos `saved` e `deleted` dos models limpam o cache. Cliente e vendedor limpam também a lista de vendas, que mostra o nome deles. Produto não mexe na lista de vendas, porque o item guarda código e descrição da data da venda.
- `Vendas::registrar` e `Vendas::cancelar` limpam as listas de vendas e de produtos **depois do commit**. O estoque muda por `increment`/`decrement`, que não disparam eventos, e limpar antes do commit deixaria outra consulta guardar de novo a lista antiga.
- O cache não depende do usuário: os resources não olham permissões nem quem está logado.

### Consequências

- Bom, porque abrir a tela de novo em até 5 minutos não vai ao banco.
- Bom, porque gravar pela aplicação limpa o cache na hora.
- Ruim, porque alteração feita direto no banco (fora dos models) ou nome de cidade alterado em Tabelas Comuns (banco central, que não limpa o cache de cada prefeitura) só aparece quando a validade vence, em até 5 minutos.
- Ruim, porque quem alterar essas tabelas com o query builder (`update`, `increment`) tem de chamar `CacheDeListagens::esquecer`.

### Confirmação

`tests/Feature/CacheDeListagensTest.php` cobre a validade de 5 minutos, a limpeza pelos eventos dos models e pelo registro e cancelamento de venda.

## Prós e contras das opções

### Só por tempo

- Bom, porque é mais simples.
- Ruim, porque a venda recém-registrada sumiria da lista por até 5 minutos.

### Só o cache do navegador

- Bom, porque não há o que limpar no servidor.
- Ruim, porque cada usuário e cada recarga da página consultam o banco.
