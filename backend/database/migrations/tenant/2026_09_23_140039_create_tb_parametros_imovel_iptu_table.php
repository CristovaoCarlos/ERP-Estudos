<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametros_imovel_iptu` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametros_imovel_iptu', function (Blueprint $table) {
            $table->date('data_vencimento_cota_unica');
            $table->date('data_vencimento_1a_parcela')->nullable();
            $table->date('data_vencimento_2a_parcela')->nullable();
            $table->date('data_vencimento_3a_parcela')->nullable();
            $table->string('exercicio_encerrado', 1);
            $table->decimal('desconto_cota_unica', 18, 2)->nullable();
            $table->decimal('valor_m2_terreno', 18, 2)->nullable();
            $table->decimal('valor_minimo_iptu', 18, 2)->nullable();
            $table->decimal('valor_tcc', 18, 4)->nullable();
            $table->decimal('valor_tip', 18, 4)->nullable();
            $table->decimal('valor_tlp', 18, 4)->nullable();
            $table->string('tipo_aliquota_iptu', 1);
            $table->string('fator_aliquota_iptu', 20)->nullable();
            $table->text('formula_vvt');
            $table->text('formula_vve');
            $table->text('formula_vvi');
            $table->text('formula_iptu');
            $table->text('formula_tcl');
            $table->text('formula_tcc');
            $table->text('formula_tip');
            $table->text('formula_tlp');
            $table->integer('id_empresa');
            $table->increments('id_parametro_imovel_iptu');
            $table->date('exercicio');
            $table->string('desconto_cota_unica_base', 1)->default('I');
            $table->decimal('desconto_parcelado', 5, 2)->default(0);
            $table->decimal('valor_minimo_parcelamento', 15, 2)->default(0);
            $table->decimal('valor_minimo_parcela', 15, 2)->default(0);
            $table->decimal('fracao_ideal_sem_edificacao', 3, 2)->default(0);
            $table->index(['id_empresa', 'exercicio'], 'idx_tb_parametros_imovel_iptu_empresa');
            $table->foreign('id_empresa', 'tb_parametros_imovel_iptu_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametros_imovel_iptu');
    }
};
