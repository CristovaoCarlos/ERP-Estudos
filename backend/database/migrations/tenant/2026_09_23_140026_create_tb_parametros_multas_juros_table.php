<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametros_multas_juros` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametros_multas_juros', function (Blueprint $table) {
            $table->bigIncrements('id_parametros_multas_juros');
            $table->integer('id_empresa');
            $table->integer('id_base_legal')->nullable();
            $table->date('vigencia_inicio');
            $table->date('vigencia_fim')->nullable();
            $table->integer('cobrar_juros')->default(0);
            $table->integer('cobrar_multa')->default(0);
            $table->integer('calculo_simples')->default(0);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametros_multas_juros');
    }
};
