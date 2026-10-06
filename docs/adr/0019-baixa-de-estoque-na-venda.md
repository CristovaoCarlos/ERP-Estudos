---
status: aceita
data: 2026-10-06
decisores: equipe ERP para Estudos
---

# Baixa de estoque no registro da venda, sem alteração da venda

## Contexto e problema

A tela Lançamentos › Vendas registra vendas de produtos que podem controlar estoque (`tb_produto.controla_estoque`). Produto sem estoque não pode ser vendido. Duas vendas podem acontecer ao mesmo tempo, e uma venda registrada às vezes precisa ser desfeita. Quando o estoque sai, como evitar que duas vendas vendam o mesmo saldo, e o que acontece com o estoque quando a venda é corrigida?

## Fatores de decisão

- O saldo nunca fica negativo por causa de vendas simultâneas.
- O histórico da venda não muda depois de registrado.
- O estoque volta quando a venda é desfeita, e só uma vez.
- Valores em dinheiro sem erro de arredondamento.

## Opções consideradas

- Baixa no registro, com os produtos travados na transação; venda imutável, desfeita só por cancelamento.
- Baixa no registro, com a venda editável (recalculando a diferença de estoque a cada alteração).
- Só conferir o saldo na tela, sem travar no servidor.

## Decisão

Opção escolhida: **baixa no registro, com trava, e venda imutável** (`App\Support\Vendas`).

- `registrar()` roda numa transação. Lê os produtos com `lockForUpdate`, soma o pedido de cada produto (o mesmo produto pode vir em mais de um item) e recusa com 422 em `itens.N.quantidade` o que passa do saldo. Só então grava a venda e faz o `decrement` do estoque.
- Produto sem controle de estoque (serviço, item sob encomenda) vende sem limite e não mexe no saldo.
- Cada item grava `baixou_estoque`. `cancelar()` devolve ao estoque só esses itens e recusa cancelar duas vezes.
- A venda não se altera nem se exclui: para corrigir, cancela-se e registra-se outra. Os itens guardam código, descrição, unidade e preço da data da venda.
- Produto, cliente e vendedor que aparecem numa venda não podem ser excluídos (422); devem ser marcados como inativos.
- Os totais são calculados no servidor com bcmath (quantidade × preço, meio centavo para cima). A tela calcula o mesmo com inteiros (`BigInt`), só para mostrar.

### Consequências

- Bom, porque o saldo é conferido e baixado sob trava: duas vendas simultâneas não vendem a mesma unidade.
- Bom, porque o histórico fica estável e o cancelamento devolve exatamente o que saiu.
- Ruim, porque um erro de digitação exige cancelar e registrar de novo.
- Ruim, porque ainda não há tabela de movimentação: o saldo muda sem um registro de cada entrada e saída. Isso fica para a entrada de notas.

### Confirmação

`tests/Feature/VendaTest.php` cobre a baixa, a recusa sem estoque ou acima do saldo (somando itens repetidos, sem gravar nada), a venda de produto sem controle, o cancelamento com devolução única e o bloqueio de exclusão. O formulário também confere o saldo antes de enviar (`src/App.test.ts`, "lançamentos › vendas").

## Prós e contras das opções

### Venda editável

- Bom, porque corrige um erro sem cancelar.
- Ruim, porque cada alteração teria de recalcular a diferença de estoque por produto, e o histórico do que foi vendido se perderia.

### Conferir só na tela

- Bom, porque é simples.
- Ruim, porque o saldo da tela fica velho e vendas simultâneas deixariam o estoque negativo.
