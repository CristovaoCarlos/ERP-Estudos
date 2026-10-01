<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_itbi_imoveis_originados` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_itbi_imoveis_originados', function (Blueprint $table) {
            $table->unsignedBigInteger('id_itbi');
            $table->unsignedBigInteger('id_imovel_pai');
            $table->decimal('area_terreno_original', 18, 2)->nullable();
            $table->decimal('area_unidade_original', 18, 2)->nullable();
            $table->decimal('area_total_edificacao_original', 18, 2)->nullable();
            $table->decimal('area_total_hec_original', 18, 2)->nullable();
            $table->decimal('area_agricultura_original', 18, 2)->nullable();
            $table->decimal('area_preservacao_original', 18, 2)->nullable();
            $table->unsignedBigInteger('id_imovel_filho');
            $table->primary('id_itbi');
            $table->foreign('id_imovel_filho', 'tb_itbi_imoveis_originados_id_imovel_filho_fkey')->references('id_imovel')->on('tb_imovel');
            $table->foreign('id_imovel_pai', 'tb_itbi_imoveis_originados_id_imovel_pai_fkey')->references('id_imovel')->on('tb_imovel');
            $table->foreign('id_itbi', 'tb_itbi_imoveis_originados_id_itbi_fkey')->references('id_doc')->on('tb_itbi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_itbi_imoveis_originados');
    }
};
