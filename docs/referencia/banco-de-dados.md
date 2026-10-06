# Banco de dados

Estrutura herdada do sistema legado ([ADR-0012](../adr/0012-schema-do-sistema-legado.md)). Os nomes de
tabela e coluna são os do legado, inclusive erros de digitação de origem.

- **Banco de cada prefeitura** (`erp_estudos_tenant_<id>`): schema `public` do legado — migrations em
  `backend/database/migrations/tenant/`.
- **Banco central** (`erp_estudos_central`): schemas `tbcomuns` (`tc_*`) e `tbinternas` (`ti_*`) do legado,
  iguais para todas as prefeituras — migrations em `backend/database/migrations/`.
- O schema `seguranca` do legado não foi migrado: usuários e tokens ficam no central
  ([ADR-0003](../adr/0003-usuarios-centralizados.md)) e os grupos de acesso são do spatie, no banco
  da prefeitura ([ADR-0009](../adr/0009-grupos-de-acesso-e-empresas.md)).

Chaves estrangeiras **não** atravessam bancos: onde uma tabela de prefeitura apontava para
`tbcomuns`/`tbinternas`, ficou só a coluna e a integridade passou a ser da aplicação (coluna
"Observação" abaixo).

Na reestruturação de 2026-10-06, as tabelas do legado que o ERP não usa saíram das migrations, sem
migration de remoção. Com elas saíram a coluna `id_empresa`, a tabela `tb_empresa`
([ADR-0013](../adr/0013-remove-id-empresa.md)) e a migration de índices e `CHECK` do legado.

## Tabelas da prefeitura

Além das tabelas de grupos e permissões do spatie (`roles`, `permissions` e as de ligação):

| Tabela | Origem | Chave primária | Observação |
| --- | --- | --- | --- |
| `check_pix_api` | legado | `id` |  |
| `mq_messages` | legado | `id` | índice `ix_mqmessages_priority` (`queue_id`, `status`, `priority`) |
| `mq_queues` | legado | `id` |  |
| `tb_cliente` | ERP | `id_cliente` | Cadastros › Clientes; `id_cidade` aponta, sem FK, para `tc_cidade` do central |
| `trigger_log` | legado | `log_id` |  |

### `tb_cliente`

Uma linha por cliente, pessoa física (`tipo_pessoa = F`) ou jurídica (`J`), com um endereço, os
contatos e os dados fiscais da NF-e.

| Grupo | Colunas |
| --- | --- |
| Identificação | `tipo_pessoa`, `cpf_cnpj` (único; CPF só com dígitos ou CNPJ normalizado, aceitando o alfanumérico), `nome` (nome ou razão social), `nome_fantasia` (só PJ) |
| Pessoa física | `rg`, `data_nascimento` |
| Endereço | `cep` (8 dígitos), `logradouro`, `numero`, `complemento`, `bairro`, `id_cidade`, `latitude` e `longitude` (padrão do Google Maps, graus decimais, 7 casas) |
| Contato | `email`, `telefone`, `celular` (só dígitos, com DDD) |

Na API e na tela, CEP, logradouro, número, bairro, cidade e celular são obrigatórios. No banco as colunas aceitam nulo.
| Fiscal | `indicador_ie` (1 contribuinte do ICMS, 2 isento, 9 não contribuinte), `inscricao_estadual` (só do contribuinte), `inscricao_municipal`, `consumidor_final` |
| Comercial | `limite_credito` (vazio: sem limite) |
| Outros | `observacoes`, `ativo`, `created_at`, `updated_at` |

Dados de exemplo: `php artisan tenants:seed --tenants=<id> --class="Database\Seeders\ClienteSeeder"`, que cria 25 clientes.

## Tabelas do banco central

Além das tabelas do próprio ERP (usuários, tokens, prefeituras, domínios, vínculos, filas e cache), a
única tabela de apoio do legado que continua é:

| Tabela | Colunas | Chave primária | Observação |
| --- | --- | --- | --- |
| `tc_cidade` | 4 | `id_cidade` | Código do IBGE em `codigo`; usada no endereço dos clientes e na tela Administração › Tabelas Comuns › Cidades |

## O que não veio do legado

| Item | Situação |
| --- | --- |
| Schema `seguranca` (12 tabelas) | Não migrado; o ERP para Estudos tem o seu próprio controle de acesso |
| Views (`view_uf`, `view_qtd_contribuintes_inconsistentes`) | Não migradas |
| Funções e extensões (`pg_trgm`, `unaccent`) | Não migradas |
| Sequências avulsas | Recriadas pelo Laravel junto das colunas `serial`/`bigserial` |
| Direção `DESC` em 3 índices | Índice criado sem a direção (o Blueprint não a descreve) |
| `varchar` sem limite (15 colunas) | Virou `text` |
