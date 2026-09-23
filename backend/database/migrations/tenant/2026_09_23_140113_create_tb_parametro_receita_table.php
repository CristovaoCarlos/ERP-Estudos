<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametro_receita` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametro_receita', function (Blueprint $table) {
            $table->bigIncrements('id_parametro_receita');
            $table->integer('id_receita_iss')->nullable();
            $table->integer('id_receita_taxa')->nullable();
            $table->integer('id_receita_tll')->nullable();
            $table->integer('id_receita_irpf')->nullable();
            $table->integer('id_receita_irpj')->nullable();
            $table->integer('id_receita_inss')->nullable();
            $table->integer('id_receita_itbi')->nullable();
            $table->integer('id_receita_habite')->nullable();
            $table->integer('id_receita_iptu')->nullable();
            $table->integer('id_receita_tcl')->nullable();
            $table->integer('id_receita_tcc')->nullable();
            $table->integer('id_receita_tip')->nullable();
            $table->integer('id_receita_tlp')->nullable();
            $table->integer('id_empresa');
            $table->unique(['id_empresa'], 'tb_parametro_receita_id_empresa_key');
            $table->foreign('id_empresa', 'tb_parametro_receita_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
            $table->foreign('id_receita_habite', 'tb_parametro_receita_id_receita_habite_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_inss', 'tb_parametro_receita_id_receita_inss_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_iptu', 'tb_parametro_receita_id_receita_iptu_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_irpf', 'tb_parametro_receita_id_receita_irpf_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_irpj', 'tb_parametro_receita_id_receita_irpj_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_iss', 'tb_parametro_receita_id_receita_iss_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_itbi', 'tb_parametro_receita_id_receita_itbi_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_taxa', 'tb_parametro_receita_id_receita_taxa_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_tcc', 'tb_parametro_receita_id_receita_tcc_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_tcl', 'tb_parametro_receita_id_receita_tcl_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_tip', 'tb_parametro_receita_id_receita_tip_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_tll', 'tb_parametro_receita_id_receita_tll_fkey')->references('id_receita')->on('tb_receita');
            $table->foreign('id_receita_tlp', 'tb_parametro_receita_id_receita_tlp_fkey')->references('id_receita')->on('tb_receita');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametro_receita');
    }
};
