---
status: aceita
data: 2026-09-24
decisores: equipe ERP para Estudos
---

# Remoção de `id_empresa` e `tb_empresa` do banco da prefeitura

## Contexto e problema

No legado, todas as prefeituras dividiam um banco, e a coluna `id_empresa` (chave para `tb_empresa`) dizia de qual prefeitura era cada linha. O [ADR-0012](0012-schema-do-sistema-legado.md) trouxe a estrutura como estava e deixou essa questão para depois. No ERP para Estudos cada prefeitura tem o seu banco ([ADR-0002](0002-multi-tenancy-banco-por-prefeitura.md)), então `id_empresa` não separa nada. Mantê-la obriga toda tela e toda regra a escolher uma "empresa" que é sempre a mesma.

## Fatores de decisão

- O banco da prefeitura já é o isolamento; um segundo isolamento dentro dele é redundante e pode ficar inconsistente.
- Telas de parâmetros (um registro por empresa no legado) ficariam com um campo Empresa sem sentido.
- Os dados da prefeitura (nome, CNPJ) já ficam no tenant, no banco central.
- A migração de dados do legado ainda não começou: é o momento barato de mudar.

## Opções consideradas

- Manter `id_empresa` e `tb_empresa` como no legado
- Remover `id_empresa` das 38 tabelas e a tabela `tb_empresa`

## Decisão

Opção escolhida: "remover", porque a coluna só repetia o que o banco da prefeitura já garante.

A migration `2026_09_24_120000_remove_id_empresa_do_legado.php` (nova, sem alterar as de origem, porque bancos já migrados precisam recebê-la):

- apaga as chaves estrangeiras para `tb_empresa`, os índices com `id_empresa` e a coluna, nas 38 tabelas;
- recria sem `id_empresa` os índices que tinham mais colunas: `unique (codigo_servico, id_empresa)` vira `unique (codigo_servico)`, com o mesmo efeito dentro da prefeitura; os que eram só de `id_empresa` somem;
- refaz no PostgreSQL os dois índices por expressão de `tb_processing` sem a coluna;
- apaga `tb_empresa`.

Tabelas de parâmetros (`tb_parametro_*`, `tb_parametros`), que tinham uma linha por empresa, passam a ter uma linha por prefeitura, e as telas delas viram formulário único.

### Consequências

- Bom, porque telas e regras não precisam mais escolher nem filtrar empresa.
- Bom, porque unicidades como CPF/CNPJ do contribuinte e código do serviço continuam valendo, agora por banco.
- Ruim, porque a migração de dados do legado terá que filtrar cada tabela pelo `id_empresa` da prefeitura ao importar, e descartar a coluna.
- Ruim, porque o `down()` devolve a estrutura, não os dados: a coluna volta aceitando null.

### Confirmação

`ParametroReceitaTest::test_banco_da_prefeitura_nao_tem_mais_empresa` confere que `tb_empresa` não existe e que tabelas que tinham a coluna não a têm mais. No PostgreSQL, `select count(*) from information_schema.columns where column_name = 'id_empresa'` no banco de uma prefeitura dá 0.
