<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametro_nota_fiscal` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametro_nota_fiscal', function (Blueprint $table) {
            $table->bigIncrements('id_parametro_nota_fiscal');
            $table->string('tipo_numeracao', 1)->nullable();
            $table->string('serie', 3);
            $table->string('imprimir_op', 1)->nullable();
            $table->string('preencher_data_na_op', 1)->default('N');
            $table->string('exibir_info_credito_cc_op', 1)->default('N');
            $table->string('assinatura_1', 100)->nullable();
            $table->string('assinatura_2', 100)->nullable();
            $table->binary('assinatura_img')->nullable();
            $table->string('assinatura_img_hash', 32)->nullable();
            $table->string('assinatura_op1', 100)->nullable();
            $table->string('assinatura_op2', 100)->nullable();
            $table->string('imp_apos_pagamento', 1);
            $table->text('imp_apos_pagamento_te');
            $table->string('exibir_banco_prestador', 1)->nullable();
            $table->string('exibir_carimbo_op', 1);
            $table->bigInteger('id_empresa');
            $table->string('vencimento_tipo', 1)->nullable()->comment('B - Dia base\\nA - Dias após emissão');
            $table->smallInteger('vencimento_valor')->nullable()->comment('Para B: aceita valores de 1 - 31');
            $table->integer('prazo_max_cancelamento')->nullable();
            $table->integer('id_modelo_historico_nota')->nullable();
            $table->decimal('p_ibsuf', 14, 2)->nullable();
            $table->decimal('p_ibsmun', 14, 2)->nullable();
            $table->decimal('p_cbs', 14, 2)->nullable();
            $table->unique(['id_empresa'], 'uq_tb_parametro_nota_fiscal_empresa');
            $table->foreign('id_empresa', 'tb_parametro_nota_fiscal_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
            $table->foreign('id_modelo_historico_nota', 'tb_parametro_nota_fiscal_id_modelo_fk')->references('id_modelo_historico_nota')->on('tb_modeldo_historico_nota_fsical');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametro_nota_fiscal');
    }
};
