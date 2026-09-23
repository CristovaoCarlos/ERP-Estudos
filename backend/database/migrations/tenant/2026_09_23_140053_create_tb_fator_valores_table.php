<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_fator_valores` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_fator_valores', function (Blueprint $table) {
            $table->increments('id_fator_valores');
            $table->integer('id_item');
            $table->decimal('valor_fator', 18, 4)->nullable();
            $table->integer('id_parametro_imovel_iptu');
            $table->unique(['id_parametro_imovel_iptu', 'id_item'], 'tb_fator_valores_id_parametro_imovel_iptu_id_item_key');
            $table->foreign('id_parametro_imovel_iptu', 'tb_fator_valores_id_parametro_imovel_iptu_fkey')->references('id_parametro_imovel_iptu')->on('tb_parametros_imovel_iptu');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_fator_valores');
    }
};
