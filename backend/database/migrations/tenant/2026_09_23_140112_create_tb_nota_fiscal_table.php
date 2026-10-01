<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_nota_fiscal` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_nota_fiscal', function (Blueprint $table) {
            $table->unsignedBigInteger('id_doc');
            $table->string('codigo_automatico', 50)->nullable();
            $table->string('codigo_impressao', 30)->nullable();
            $table->string('serie_nfse', 3);
            $table->integer('numero_nfse');
            $table->string('orgao_gerador_codigo_municipio', 7);
            $table->string('orgao_gerador_uf', 2);
            $table->unsignedInteger('id_tomador')->nullable();
            $table->string('houve_intermediacao', 1);
            $table->string('intermediario_cpf_cnpj', 14)->nullable();
            $table->string('intermediario_inscricao_municipal', 15)->nullable();
            $table->string('intermediario_nome_razao_social', 150)->nullable();
            $table->unsignedBigInteger('id_servico');
            $table->string('construcao_civil_art', 35)->nullable();
            $table->string('construcao_civil_codigo_obra', 35)->nullable();
            $table->string('iss_retido', 1)->nullable();
            $table->integer('responsavel_retencao')->nullable();
            $table->string('codigo_tributacao_municipio', 20)->nullable();
            $table->integer('exigibilidade_iss')->nullable();
            $table->string('municipio_incidencia', 7)->nullable();
            $table->string('numero_processo', 30)->nullable();
            $table->text('info_adicionais_observacao')->nullable();
            $table->decimal('valor_pis', 18, 2)->default(0);
            $table->decimal('valor_cofins', 18, 2)->default(0);
            $table->decimal('valor_inss', 18, 2)->nullable()->default(0);
            $table->decimal('valor_ir', 18, 2)->nullable()->default(0);
            $table->decimal('valor_csll', 18, 2)->default(0);
            $table->decimal('valor_outras_retencoes', 15, 2)->default(0);
            $table->string('cc_gerada', 1)->default('N');
            $table->text('observacao')->nullable();
            $table->string('informacao_issqn', 1)->nullable();
            $table->integer('id_municipio_issqn')->nullable();
            $table->decimal('valor_aliquota_escolhida', 18, 2)->nullable()->default(0);
            $table->decimal('valor_total_servicos', 18, 2)->nullable()->default(0);
            $table->decimal('valor_total_desconto_incondicionado', 18, 2)->default(0);
            $table->decimal('valor_total_deducoes', 18, 2)->default(0);
            $table->decimal('valor_total_desconto_condicionado', 18, 2)->default(0);
            $table->decimal('valor_liquido', 18, 2)->default(0);
            $table->decimal('valor_credito', 18, 2)->default(0);
            $table->decimal('valor_iss', 18, 2)->nullable()->default(0);
            $table->string('origem_dados', 20)->default('STMSIAT_WEB');
            $table->string('cnae_codigo', 15)->nullable();
            $table->text('cnae_descricao')->nullable();
            $table->decimal('servico_iss_aliquota', 18, 4)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->string('tipo_recibo', 1)->nullable()->comment('B - recibo no bruto L - Recibo no liquido S - Recibo no liquido com iss e ir em dams separadas');
            $table->bigInteger('qtd_emitida')->nullable();
            $table->text('detalhe_calculo_inss')->nullable();
            $table->text('detalhe_calculo_ir')->nullable();
            $table->text('detalhe_calculo_taxa')->nullable();
            $table->text('detalhe_calculo_iss')->nullable();
            $table->text('historico')->nullable();
            $table->integer('id_origem')->nullable();
            $table->unsignedBigInteger('id_conta_bancaria')->nullable();
            $table->bigInteger('id_aliquota_servico_ir')->nullable();
            $table->bigInteger('id_tomador_internacional')->nullable();
            $table->string('tomador_estrangeiro', 1)->default('N');
            $table->decimal('valor_taxa', 18, 2)->nullable();
            $table->string('servico_nbs', 20)->nullable();
            $table->string('servico_detalhe', 10)->nullable();
            $table->string('external_id', 80)->nullable();
            $table->integer('tipo_tributacao_issqn')->nullable()->comment('1- Operação tributável; 2- Exportação de serviços; 3- Não Incidência; 4- Imunidade;');
            $table->integer('tipo_retencao_issqn')->nullable()->comment('1- Não retido; 2- Retido pelo tomador; 3- Retido pelo intermediador;');
            $table->string('status_adn', 1)->nullable()->default('P')->comment('P- Pendente; C- Compartilhado; R- Rejeitado; E- Error;');
            $table->string('id_api', 80)->nullable();
            $table->string('chave_acesso_nfse', 60)->nullable();
            $table->text('last_error_api')->nullable();
            $table->string('codigo_cst_piscofins', 2)->nullable()->comment('00- Nenhum; 01- OT com alíquota básica; 02- OT com alíquota diferenciada; 03- OT com alíquota por unidade de medida de produto; 04- OT monofásica- revenda a alíquota zero; 05- OT p/ substituição tributária; 06- OT a alíquota zero; 07- OT da contribuição; ');
            $table->string('construcao_civil_insc_mobiliaria', 30)->nullable();
            $table->string('construcao_civil_logradouro', 255)->nullable();
            $table->string('construcao_civil_end_numero', 60)->nullable();
            $table->string('construcao_civil_end_bairro', 60)->nullable();
            $table->string('construcao_civil_end_cep', 30)->nullable();
            $table->integer('servico_ext_md_prestacao')->nullable()->default(0)->comment('0- Desconhecido (tipo não informado na nota de origem); 1- Transfronteiriço; 2- Consumo no Brasil; 3- Movimento Temporário de Pessoas Físicas; 4- Consumo no Exterior;');
            $table->integer('servico_ext_vinc_prest')->nullable()->default(0);
            $table->string('servico_ext_tp_moeda', 100)->nullable();
            $table->decimal('servico_ext_vserv_moeda', 18, 2)->nullable()->comment('Valor do servico expresso na moeda especificada');
            $table->string('servico_ext_mecafcomexp', 2)->nullable();
            $table->string('servico_ext_mecafcomext', 2)->nullable();
            $table->integer('servico_ext_mov_temp_bens')->nullable()->default(0)->comment('0- Desconhecido (tipo não informado na nota de origem); 1- Não; 2- Vinculada - Declaração de Importação; 3- Vinculada - Declaração de Exportação;');
            $table->integer('servico_ext_mdic')->nullable()->default(0)->comment('0- Não enviar para o MDIC; 1- Enviar para o MDIC;');
            $table->string('servico_ext_ndi', 12)->nullable();
            $table->string('servico_ext_nre', 12)->nullable();
            $table->string('ibscbs_class_trib', 7)->nullable();
            $table->string('ibscbs_indop', 7)->nullable();
            $table->integer('ibscbs_ind_final')->nullable()->comment('0- Não; 1- Sim');
            $table->integer('ibscbs_tp_oper')->nullable()->comment('1 – Fornecimento com pagamento posterior;2 - Recebimento do pagamento com fornecimento já realizado;3 – Fornecimento com pagamento já realizado;4 – Recebimento do pagamento com fornecimento posterior;5 – Fornecimento e recebimento do pagamento concomitant');
            $table->text('ibscbs_ref_nfse')->nullable()->comment('colocar chaves de acesso nfse; separar por virgula;');
            $table->integer('ibscbs_tp_ent_gov')->nullable()->comment('1 - União;2 - Estado;3 - Distrito Federal;4 - Município;');
            $table->integer('ibscbs_ind_dest')->nullable()->comment('0- O destinatário é o proprio tomador; 1- O destinatário n é o próprio tomador;');
            $table->string('ibscbs_dest_estrangeiro', 1)->nullable()->comment('definir se o tomador é estrangiero ou não');
            $table->bigInteger('ibscbs_dest_id')->nullable();
            $table->string('ibscbs_imv_insc', 30)->nullable();
            $table->string('ibscbs_imv_cib', 9)->nullable();
            $table->string('ibscbs_imv_cep', 10)->nullable();
            $table->string('ibscbs_imv_endpost', 50)->nullable();
            $table->string('ibscbs_imv_xcidade', 255)->nullable();
            $table->string('ibscbs_imv_est_prov_reg', 255)->nullable();
            $table->string('ibscbs_imv_xlgr', 255)->nullable();
            $table->string('ibscbs_imv_nro', 60)->nullable();
            $table->string('ibscbs_imv_xbairro', 60)->nullable();
            $table->integer('ibscbs_pdif_mun')->nullable();
            $table->integer('ibscbs_pdif_uf')->nullable();
            $table->integer('ibscbs_pdif_cbs')->nullable();
            $table->string('ibscbs_cloc_incid', 7)->nullable();
            $table->decimal('ibscbs_predutor', 14, 2)->nullable();
            $table->string('servico_atv_xnome', 255)->nullable();
            $table->date('servico_atv_dtini')->nullable();
            $table->date('servico_atv_dtfim')->nullable();
            $table->string('servico_atv_idatvevt', 30)->nullable();
            $table->string('servico_atv_cep', 12)->nullable();
            $table->string('servico_atv_endpost', 50)->nullable();
            $table->string('servico_atv_xcidade', 200)->nullable();
            $table->string('servico_atv_est_prov_reg', 200)->nullable();
            $table->string('servico_atv_xlgr', 255)->nullable();
            $table->string('servico_atv_nro', 60)->nullable();
            $table->string('servico_atv_xbairro', 60)->nullable();
            $table->string('servico_atv_xcpl', 156)->nullable();
            $table->primary('id_doc');
            $table->foreign('id_conta_bancaria', 'tb_nota_fiscal_id_conta_bancaria_fkey')->references('id_contribuinte_conta_bancaria')->on('tb_contribuinte_conta_bancaria');
            $table->foreign('id_doc', 'tb_nota_fiscal_tb_doc_fk')->references('id_doc')->on('tb_doc');
            $table->foreign('id_servico', 'tb_nota_fiscal_unificada_id_servico_fkey')->references('id_servico')->on('tb_servico');
            $table->foreign('id_tomador', 'tb_nota_fiscal_unificada_id_tomador_fkey')->references('id_tomador')->on('tb_tomador');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_nota_fiscal');
    }
};
