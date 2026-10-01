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

A coluna `id_empresa`, que no legado separava as prefeituras dentro de um banco só, e a tabela
`tb_empresa` foram removidas ([ADR-0013](../adr/0013-remove-id-empresa.md)): no ERP para Estudos o banco já é da
prefeitura. Os índices que combinavam `id_empresa` com outras colunas continuam, só com as outras.

## Tabelas da prefeitura (82)

| Tabela | Colunas | Chave primária | Observação |
| --- | --- | --- | --- |
| `check_pix_api` | 9 | `id` |  |
| `mq_messages` | 10 | `id` |  |
| `mq_queues` | 2 | `id` |  |
| `stm_migrations` | 4 | `id` |  |
| `tb_alvara` | 23 | `id_doc` |  |
| `tb_alvara_cnae` | 5 | `id` | referências sem FK: `tbinternas.ti_cnae` |
| `tb_alvara_impressao` | 27 | `id_doc` |  |
| `tb_alvara_tipo` | 3 | `id_tipo_alvara` |  |
| `tb_alvara_tipo_adicional_faixas` | 6 | `id_alvara_tipo_adicional_faixas` |  |
| `tb_base_legal` | 2 | `id_base_legal` |  |
| `tb_cartorio` | 2 | `id_cartorio` |  |
| `tb_certidao_negativa` | 12 | `id_certidao` |  |
| `tb_contribuinte` | 36 | `id_contribuinte` | referências sem FK: `seguranca.sec_users` |
| `tb_contribuinte_cnae` | 4 | `id` | referências sem FK: `tbinternas.ti_cnae` |
| `tb_contribuinte_conta_bancaria` | 6 | `id_contribuinte_conta_bancaria` | referências sem FK: `tbcomuns.tc_banco` |
| `tb_contribuinte_documento` | 4 | `id_contribuinte_documento` | referências sem FK: `tbinternas.ti_tipo_documento` |
| `tb_contribuinte_representante` | 5 | `id_contribuinte_representante` |  |
| `tb_contribuinte_servico` | 10 | `id_cotrib_serv` |  |
| `tb_contribuinte_situacao` | 6 | `id` |  |
| `tb_convenio` | 20 | `id_convenio` | referências sem FK: `tbcomuns.tc_banco` |
| `tb_dados_sociais_imovel` | 18 | `id_dados_sociais` |  |
| `tb_dam` | 27 | `id_dam` |  |
| `tb_dam_doc` | 3 | `id_dam_doc` |  |
| `tb_dam_impostos` | 7 | `id` |  |
| `tb_dam_vencimentos` | 8 | `id_dam_vencimentos` |  |
| `tb_doc` | 11 | `id_doc` | referências sem FK: `tbinternas.ti_dam_tipo` |
| `tb_doc_imposto` | 6 | `id_doc_imposto` |  |
| `tb_endereco` | 8 | `id_endereco` | referências sem FK: `tbcomuns.tc_cidade` |
| `tb_fator_gleba` | 5 | `id_gleba` |  |
| `tb_fator_localizacao` | 2 | `id_fator_localizacao` |  |
| `tb_fator_localizacao_valores` | 4 | `id_fator_localizacao_valores` |  |
| `tb_fator_valores` | 4 | `id_fator_valores` | referências sem FK: `tbinternas.ti_fator_itens` |
| `tb_habite` | 18 | `id_doc` |  |
| `tb_habite_impressao` | 25 | `id_habite` |  |
| `tb_imovel` | 20 | `id_imovel` |  |
| `tb_imovel_detalhamento_iptu` | 50 | `id_imovel_detalhamento_iptu` | referências sem FK: `tbinternas.ti_fator_itens` |
| `tb_imovel_historico` | 7 | `id_historico` |  |
| `tb_imovel_itbi_rural` | 7 | `id_imovel` |  |
| `tb_inss` | 4 | `id_inss` |  |
| `tb_iptu_lancamentos` | 42 | `id_doc` |  |
| `tb_iptu_lotes` | 34 | `id_lote` |  |
| `tb_iptu_regra_aliquota` | 6 | `id_iptu_regra_aliquota` |  |
| `tb_iptu_regra_parcelas` | 5 | `id_iptu_regra_parcelas` |  |
| `tb_iptu_regra_previo` | 4 | `id_iptu_regra_previo` |  |
| `tb_ir` | 22 | `id_ir` |  |
| `tb_isencao` | 2 | `id_isencao` |  |
| `tb_itbi` | 21 | `id_doc` |  |
| `tb_itbi_contribuintes` | 6 | `id` |  |
| `tb_itbi_imoveis_originados` | 9 | `id_itbi` |  |
| `tb_itbi_impressao` | 33 | `id_doc` |  |
| `tb_levantamento_drone` | 7 | `id_levantamento` |  |
| `tb_mail_sended` | 7 | `id_mail_sended` |  |
| `tb_mails_blacklist` | 7 | `mail` |  |
| `tb_modeldo_historico_nota_fsical` | 3 | `id_modelo_historico_nota` |  |
| `tb_modelo_certidao_negativa` | 4 | `id_modelo_certidao` |  |
| `tb_natureza_itbi` | 5 | `id_natureza_itbi` |  |
| `tb_negociacao` | 6 | `id_negociacao` | referências sem FK: `seguranca.sec_users` |
| `tb_nota_fiscal` | 119 | `id_doc` | referências sem FK: `tbcomuns.tc_cidade`, `tbinternas.ti_aliquota_servico_ir`, `tbinternas.ti_nfse_lcp116_detalhamento`, `tbinternas.ti_nfse_nbs` |
| `tb_nota_fiscal_impressao` | 52 | `id_doc` |  |
| `tb_nota_fiscal_servico` | 17 | `id_nota_fiscal_servico` |  |
| `tb_parametro_alvara` | 13 | `id_parametro_alvara` |  |
| `tb_parametro_certidao_negativa` | 6 | `id_parametro_certidao_negativa` |  |
| `tb_parametro_habite` | 11 | `id_parametro_habite` |  |
| `tb_parametro_itbi` | 7 | `id_parametro_itbi` |  |
| `tb_parametro_nota_fiscal` | 23 | `id_parametro_nota_fiscal` | referências sem FK: `tbinternas.ti_nota_numeracao` |
| `tb_parametro_receita` | 14 | `id_parametro_receita` |  |
| `tb_parametros` | 14 | `id_parametro` |  |
| `tb_parametros_gestores` | 4 | — | referências sem FK: `seguranca.sec_users` |
| `tb_parametros_imovel_iptu` | 28 | `id_parametro_imovel_iptu` | referências sem FK: `tbinternas.ti_fator` |
| `tb_parametros_multas_juros` | 7 | `id_parametros_multas_juros` |  |
| `tb_parametros_multas_juros_calculos` | 7 | `id_parametros_multas_juros_calculos` |  |
| `tb_processing` | 8 | `id` |  |
| `tb_processing_msg` | 5 | `id` |  |
| `tb_receita` | 10 | `id_receita` |  |
| `tb_retorno_bancario` | 12 | `id_retorno_bancario` |  |
| `tb_retorno_bancario_registros` | 15 | `id_retorno_bancario_registros` |  |
| `tb_servico` | 10 | `id_servico` | referências sem FK: `tbinternas.ti_lcp116` |
| `tb_tomador` | 11 | `id_tomador` |  |
| `tb_tomador_contrib` | 3 | `id_tomador_contrib` |  |
| `tb_tomador_internacional` | 9 | `id_tomador_internacional` | referências sem FK: `tbinternas.ti_pais` |
| `tb_ufir` | 4 | `id_ufir` |  |
| `trigger_log` | 4 | `log_id` |  |

Índices por expressão (sobre o JSON de `tb_processing`), os equivalentes dos índices parciais do legado e as
restrições `CHECK` ficam na migration `2026_09_23_142000_adiciona_indices_e_checks_do_legado.php`, em SQL,
e só rodam no MySQL ([ADR-0015](../adr/0015-mysql.md)).

## Tabelas do banco central (25)

| Tabela | Colunas | Chave primária | Observação |
| --- | --- | --- | --- |
| `tc_banco` | 3 | `id_banco` |  |
| `tc_cidade` | 4 | `id_cidade` |  |
| `tc_selic` | 4 | `id` |  |
| `ti_aliquota_servico_ir` | 6 | `id_aliquota_ir` |  |
| `ti_cnae` | 10 | `codigo` |  |
| `ti_dam_tipo` | 2 | `cod_dam_tipo` |  |
| `ti_fator` | 3 | `fator` |  |
| `ti_fator_itens` | 4 | `id_item` |  |
| `ti_generica` | 4 | `id` |  |
| `ti_lcp116` | 2 | `codigo` |  |
| `ti_licencas` | 8 | — |  |
| `ti_motivo_situacao_cadastral` | 2 | `codigo` |  |
| `ti_nfse_class_tributaria` | 2 | `codigo` |  |
| `ti_nfse_indop` | 3 | `codigo` |  |
| `ti_nfse_lcp116_detalhamento` | 2 | `lcp116_codigo` |  |
| `ti_nfse_nbs` | 2 | `nbs_codigo` |  |
| `ti_nfse_nbs_lcp116` | 2 | `item_lcp116`, `nbs_codigo` |  |
| `ti_nfse_relacao_tributacao` | 5 | `id` |  |
| `ti_nota_numeracao` | 2 | `cod_numeracao` |  |
| `ti_pais` | 5 | `id_pais` |  |
| `ti_segmentos` | 2 | `codigo` |  |
| `ti_situacao_cadastral` | 2 | `codigo` |  |
| `ti_solicitacao_acesso` | 10 | `id` |  |
| `ti_tipo_documento` | 3 | `id_tipo_documento` |  |
| `ti_tipo_gestor` | 3 | `id_tipo_gestor` |  |

Estas tabelas ainda estão **vazias**: a carga dos dados de apoio (cidades, bancos, SELIC, CNAE,
LCP 116, países, fatores) é um passo à parte, a partir do dump do legado.

## O que não veio do legado

| Item | Situação |
| --- | --- |
| Schema `seguranca` (12 tabelas) | Não migrado; o ERP para Estudos tem o seu próprio controle de acesso |
| Views (`view_uf`, `view_qtd_contribuintes_inconsistentes`) | Não migradas |
| Funções e extensões (`pg_trgm`, `unaccent`) | Não migradas |
| Sequências avulsas | Recriadas pelo Laravel junto das colunas `serial`/`bigserial` |
| Direção `DESC` em 3 índices | Índice criado sem a direção (o Blueprint não a descreve) |
| `varchar` sem limite (15 colunas) | Virou `text` |
