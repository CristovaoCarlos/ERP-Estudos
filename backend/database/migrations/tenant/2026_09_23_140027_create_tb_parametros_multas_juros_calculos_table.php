<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametros_multas_juros_calculos` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametros_multas_juros_calculos', function (Blueprint $table) {
            $table->bigIncrements('id_parametros_multas_juros_calculos');
            $table->integer('id_parametros_multas_juros');
            $table->string('tipo', 1);
            $table->string('tipo_valor', 1);
            $table->decimal('valor', 18, 4)->nullable();
            $table->integer('faixa_inicial')->nullable();
            $table->integer('faixa_final')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametros_multas_juros_calculos');
    }
};
