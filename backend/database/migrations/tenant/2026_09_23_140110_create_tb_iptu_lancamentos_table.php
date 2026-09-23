<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_iptu_lancamentos` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_iptu_lancamentos', function (Blueprint $table) {
            $table->bigInteger('id_doc');
            $table->integer('id_lote');
            $table->string('status_usuario', 255);
            $table->text('status_motivo')->nullable();
            $table->integer('sequencial_processamento')->nullable();
            $table->integer('qtd_parcelas')->nullable();
            $table->string('isento_iptu', 1)->nullable();
            $table->string('isento_tsu', 1)->nullable();
            $table->decimal('vvt_valor', 18, 2)->nullable();
            $table->decimal('vve_valor', 18, 2)->nullable();
            $table->decimal('vvi_valor', 18, 2)->nullable();
            $table->integer('iptu_id')->nullable();
            $table->decimal('iptu_valor', 18, 2)->nullable();
            $table->decimal('iptu_valor_original', 18, 2)->nullable();
            $table->integer('tcl_id')->nullable();
            $table->decimal('tcl_valor', 18, 2)->nullable();
            $table->integer('tcc_id')->nullable();
            $table->decimal('tcc_valor', 18, 2)->nullable();
            $table->integer('tip_id')->nullable();
            $table->decimal('tip_valor', 18, 2)->nullable();
            $table->integer('tlp_id')->nullable();
            $table->decimal('tlp_valor', 18, 2)->nullable();
            $table->text('vvt_formula')->nullable();
            $table->text('vvt_variaveis')->nullable();
            $table->text('vve_formula')->nullable();
            $table->text('vve_variaveis')->nullable();
            $table->text('vvi_formula')->nullable();
            $table->text('vvi_variaveis')->nullable();
            $table->text('iptu_formula')->nullable();
            $table->text('iptu_variaveis')->nullable();
            $table->text('tcl_formula')->nullable();
            $table->text('tcl_variaveis')->nullable();
            $table->text('tcc_formula')->nullable();
            $table->text('tcc_variaveis')->nullable();
            $table->text('tip_formula')->nullable();
            $table->text('tip_variaveis')->nullable();
            $table->text('tlp_formula')->nullable();
            $table->text('tlp_variaveis')->nullable();
            $table->integer('id_imovel');
            $table->string('status', 1);
            $table->timestamp('processed_in')->nullable();
            $table->integer('id_origem')->nullable();
            $table->primary('id_doc');
            $table->index(['id_lote', 'id_doc'], 'idx_tb_iptu_lancamentos_lote_doc');
            $table->foreign('id_imovel', 'tb_iptu_lancamentos_id_imovel_fkey')->references('id_imovel')->on('tb_imovel');
            $table->foreign('id_lote', 'tb_iptu_lancamentos_id_lote_fkey')->references('id_lote')->on('tb_iptu_lotes');
            $table->foreign('iptu_id', 'tb_iptu_lancamentos_iptu_id_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_doc', 'tb_iptu_lancamentos_tb_doc_fk')->references('id_doc')->on('tb_doc');
            $table->foreign('tcc_id', 'tb_iptu_lancamentos_tcc_id_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('tcl_id', 'tb_iptu_lancamentos_tcl_id_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('tip_id', 'tb_iptu_lancamentos_tip_id_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('tlp_id', 'tb_iptu_lancamentos_tlp_id_fkey')->references('id_receita')->on('tb_receita');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_iptu_lancamentos');
    }
};
