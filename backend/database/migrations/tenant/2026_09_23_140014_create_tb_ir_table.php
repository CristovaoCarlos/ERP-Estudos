<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_ir` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_ir', function (Blueprint $table) {
            $table->increments('id_ir');
            $table->integer('id_empresa');
            $table->date('data');
            $table->decimal('faixa1', 18, 2);
            $table->decimal('aliquota1', 18, 2);
            $table->decimal('deducao1', 18, 2);
            $table->decimal('faixa2', 18, 2)->nullable();
            $table->decimal('aliquota2', 18, 2)->nullable();
            $table->decimal('deducao2', 18, 2)->nullable();
            $table->decimal('faixa3', 18, 2)->nullable();
            $table->decimal('aliquota3', 18, 2)->nullable();
            $table->decimal('deducao3', 18, 2)->nullable();
            $table->decimal('faixa4', 18, 2)->nullable();
            $table->decimal('aliquota4', 18, 2)->nullable();
            $table->decimal('deducao4', 18, 2)->nullable();
            $table->decimal('aliquota_irpj', 18, 2)->nullable();
            $table->decimal('deducao_simplificada', 18, 2);
            $table->decimal('reducao_fx_1', 18, 2)->nullable();
            $table->decimal('reducao_fx_2', 18, 2)->nullable();
            $table->decimal('reducao_vr_1', 18, 2)->nullable();
            $table->decimal('reducao_vr_2', 18, 2)->nullable();
            $table->decimal('reducao_idx_1', 7, 7)->nullable();
            $table->decimal('reducao_idx_2', 7, 7)->nullable();
            $table->index(['id_empresa', 'data'], 'idx_tb_ir_empresa_data_desc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_ir');
    }
};
