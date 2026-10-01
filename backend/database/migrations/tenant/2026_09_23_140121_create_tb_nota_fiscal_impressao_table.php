<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_nota_fiscal_impressao` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_nota_fiscal_impressao', function (Blueprint $table) {
            $table->unsignedBigInteger('id_doc');
            $table->string('prestador_cpf_cnpj', 14)->nullable();
            $table->string('prestador_inscricao_municipal', 15)->nullable();
            $table->string('prestador_nome_razao_social', 150)->nullable();
            $table->string('prestador_nome_fantasia', 150)->nullable();
            $table->string('prestador_endereco_logradouro', 125)->nullable();
            $table->string('prestador_endereco_numero', 50)->nullable();
            $table->string('prestador_endereco_complemento', 60)->nullable();
            $table->string('prestador_endereco_bairro', 60)->nullable();
            $table->string('prestador_endereco_municipio_codigo', 7)->nullable();
            $table->string('prestador_endereco_uf', 2)->nullable();
            $table->string('prestador_endereco_cep', 8)->nullable();
            $table->string('prestador_contato_telefone', 20)->nullable();
            $table->string('prestador_contato_email', 80)->nullable();
            $table->string('prestador_regime_tributacao', 1)->nullable();
            $table->string('prestador_optante_simples_nacional', 1)->nullable();
            $table->integer('prestador_porte_empresa')->nullable();
            $table->string('prestador_nit_pis', 11)->nullable();
            $table->string('prestador_endereco_municipio_descricao', 100)->nullable();
            $table->string('tomador_cpf_cnpj', 14)->nullable();
            $table->string('tomador_nome_razao_social', 150)->nullable();
            $table->string('tomador_endereco_logradouro', 125)->nullable();
            $table->string('tomador_endereco_numero', 50)->nullable();
            $table->string('tomador_endereco_complemento', 60)->nullable();
            $table->string('tomador_endereco_bairro', 60)->nullable();
            $table->string('tomador_endereco_municipio_codigo', 7)->nullable();
            $table->string('tomador_endereco_uf', 2)->nullable();
            $table->string('tomador_endereco_cep', 8)->nullable();
            $table->string('tomador_contato_telefone', 20)->nullable();
            $table->string('tomador_contato_email', 80)->nullable();
            $table->string('tomador_endereco_municipio_descricao', 100)->nullable();
            $table->string('tomador_orgao_publico', 1)->nullable()->default('T');
            $table->string('servico_codigo', 5)->nullable();
            $table->decimal('servico_iss_aliquota', 18, 2)->nullable();
            $table->decimal('servico_reducao_base_calculo', 18, 2)->nullable()->default(0.00);
            $table->string('servico_inss_cobranca', 1)->nullable()->default('S');
            $table->decimal('servico_inss_deducao', 18, 2)->nullable()->default(0.00);
            $table->decimal('servico_ir_deducao', 18, 2)->nullable()->default(0.00);
            $table->string('servico_descricao', 500)->nullable();
            $table->decimal('valor_aliquota_escolhida', 18, 2)->nullable()->default(0);
            $table->decimal('valor_total_servicos', 18, 2)->nullable()->default(0);
            $table->decimal('valor_total_desconto_incondicionado', 18, 2)->nullable()->default(0);
            $table->decimal('valor_total_deducoes', 18, 2)->nullable()->default(0);
            $table->decimal('valor_base_calculo', 18, 2)->nullable()->default(0);
            $table->decimal('valor_total_desconto_condicionado', 18, 2)->nullable()->default(0);
            $table->decimal('valor_liquido', 18, 2)->nullable()->default(0);
            $table->decimal('valor_credito', 18, 2)->nullable()->default(0);
            $table->decimal('valor_iss', 18, 2)->nullable()->default(0);
            $table->decimal('valor_total_nota', 18, 2)->nullable()->default(0);
            $table->string('prestador_tll', 50)->nullable();
            $table->string('prestador_conta_bancaria', 255)->nullable();
            $table->string('tomador_estrangeiro', 1)->nullable();
            $table->primary('id_doc');
            $table->foreign('id_doc', 'tb_nota_fiscal_impressao_unificada_id_nota_fiscal_fkey')->references('id_doc')->on('tb_nota_fiscal');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_nota_fiscal_impressao');
    }
};
