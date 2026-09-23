<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_dam_impostos` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_dam_impostos', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('id_dam');
            $table->bigInteger('id_receita');
            $table->string('tipo_valor', 1)->nullable();
            $table->decimal('base_calculo', 18, 2)->nullable();
            $table->decimal('referencia', 18, 2)->nullable();
            $table->decimal('valor', 18, 2)->nullable();
            $table->index(['id_dam'], 'idx_tb_dam_impostos_id_dam');
            $table->index(['id_receita'], 'idx_tb_dam_impostos_id_receita');
            $table->foreign('id_dam', 'tb_dam_impostos_id_dam_fkey')->references('id_dam')->on('tb_dam');
            $table->foreign('id_receita', 'tb_dam_impostos_id_receita_fkey')->references('id_receita')->on('tb_receita');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_dam_impostos');
    }
};
