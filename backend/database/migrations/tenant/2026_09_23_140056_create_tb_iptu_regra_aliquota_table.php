<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_iptu_regra_aliquota` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_iptu_regra_aliquota', function (Blueprint $table) {
            $table->increments('id_iptu_regra_aliquota');
            $table->integer('id_item');
            $table->decimal('aliquota', 18, 2);
            $table->decimal('valor_venal_minimo', 18, 2);
            $table->decimal('valor_venal_maximo', 18, 2);
            $table->unsignedInteger('id_parametro_imovel_iptu');
            $table->foreign('id_parametro_imovel_iptu', 'tb_iptu_regra_aliquota_id_parametro_imovel_iptu_fkey')->references('id_parametro_imovel_iptu')->on('tb_parametros_imovel_iptu');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_iptu_regra_aliquota');
    }
};
