<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_alvara_tipo_adicional_faixas` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_alvara_tipo_adicional_faixas', function (Blueprint $table) {
            $table->bigIncrements('id_alvara_tipo_adicional_faixas');
            $table->bigInteger('id_alvara_tipo');
            $table->decimal('faixa_inicial', 10, 2)->nullable();
            $table->decimal('faixa_final', 10, 2)->nullable();
            $table->decimal('aliquota', 10, 2)->nullable();
            $table->date('inicio_vigencia');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_alvara_tipo_adicional_faixas');
    }
};
