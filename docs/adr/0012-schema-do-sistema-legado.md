---
status: aceita (a parte de `id_empresa` e `tb_empresa` foi substituída por [0013](0013-remove-id-empresa.md))
data: 2026-09-23
decisores: equipe STM
---

# Estrutura do banco herdada do sistema legado

## Contexto e problema

O STM substitui um sistema já em produção, cujo banco PostgreSQL tem três schemas relevantes:

- `public` — dados de cada prefeitura (contribuintes, imóveis, notas fiscais, DAMs, parâmetros): 83 tabelas;
- `tbcomuns` e `tbinternas` — tabelas de apoio iguais para todas as prefeituras (cidades, bancos, SELIC, CNAE, lista de serviços da LCP 116, países, fatores do IPTU): 25 tabelas;
- `seguranca` — usuários e grupos do sistema antigo.

No legado, tudo convive em um banco só, e a separação entre prefeituras é feita pela coluna `id_empresa`. No STM, cada prefeitura tem o seu banco ([ADR-0002](0002-multi-tenancy-banco-por-prefeitura.md)). Como trazer essa estrutura?

## Opções consideradas

- Migrations do Laravel (Blueprint), geradas a partir do DDL do legado
- Uma migration única que executa o DDL do legado em SQL puro
- Redesenhar o modelo de dados do zero

## Decisão

Opção escolhida: **migrations do Laravel geradas a partir do DDL**, com esta divisão:

- `public` → `database/migrations/tenant/`, uma migration por tabela, no banco de cada prefeitura;
- `tbcomuns` + `tbinternas` → `database/migrations/`, no banco central `stm_central`, sem os prefixos de schema (os nomes `tc_*` e `ti_*` já distinguem as duas origens);
- `seguranca` **não** é migrado: usuários, tokens e sessões já ficam no central ([ADR-0003](0003-usuarios-centralizados.md)) e os grupos de acesso são do spatie, no banco da prefeitura ([ADR-0009](0009-grupos-de-acesso-e-empresas.md)).

O SQL puro foi descartado porque os testes rodam em SQLite ([ADR-0006](0006-testes-em-sqlite.md)): DDL específico do PostgreSQL não roda lá. Redesenhar o modelo foi descartado por ora: a migração dos dados das prefeituras exige a mesma estrutura.

### Adaptações

- **Chaves estrangeiras entre bancos não existem.** As 37 FKs de `public` para `tbcomuns`/`tbinternas` (CNAE, cidade, banco, tipo de DAM, fatores do IPTU, LCP 116, país…) viraram apenas colunas: a integridade fica na aplicação. As 3 FKs para `seguranca` foram descartadas junto com o schema.
- **Índices parciais, por expressão ou com `INCLUDE`** (9) e as restrições **`CHECK`** (3) não são descritos pelo Blueprint: ficam em `..._adiciona_indices_e_checks_do_legado.php`, em SQL, e só rodam no PostgreSQL.
- **Direção de índice** (`DESC`) não existe no Blueprint: os 3 índices que a usavam entraram sem ela.
- **`varchar` sem limite** (15 colunas) virou `text`, o equivalente portável.
- **Comentários de coluna** do legado foram preservados em `->comment(...)`.
- `id_empresa` e `tb_empresa` foram mantidos como no legado, embora o isolamento por banco já separe as prefeituras: mudar isso é decisão de outro momento, junto com a migração dos dados.

### Consequências

- Bom, porque a estrutura do legado existe nos dois bancos e a migração de dados pode começar.
- Bom, porque as migrations são portáveis: a suíte continua rodando em SQLite.
- Ruim, porque são 84 migrations no tenant e 25 no central, todas com nomes e colunas em português misturado com abreviações do legado (`tb_modeldo_historico_nota_fsical` inclusive, com o erro de digitação de origem).
- Ruim, porque a integridade referencial entre prefeitura e tabelas de apoio passa a depender da aplicação.
- Ruim, porque views, funções e triggers do legado não foram trazidos.

### Confirmação

`php artisan migrate` e `php artisan tenants:migrate` criam 25 e 83 tabelas. A comparação coluna a coluna entre o dump e o `information_schema` dos dois bancos não acusa diferença de nome nem de tipo.
