<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_fator_gleba` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_fator_gleba', function (Blueprint $table) {
            $table->bigIncrements('id_gleba');
            $table->decimal('area_terreno_minimo', 18, 2);
            $table->decimal('area_terreno_maximo', 18, 2);
            $table->decimal('valor_fator', 18, 4);
            $table->unsignedInteger('id_parametro_imovel_iptu');
            $table->foreign('id_parametro_imovel_iptu', 'tb_fator_gleba_id_parametro_imovel_iptu_fkey')->references('id_parametro_imovel_iptu')->on('tb_parametros_imovel_iptu');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_fator_gleba');
    }
};
