<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_iptu_regra_previo` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_iptu_regra_previo', function (Blueprint $table) {
            $table->increments('id_iptu_regra_previo');
            $table->decimal('valor_iptu1', 18, 2);
            $table->decimal('valor_iptu2', 18, 2);
            $table->unsignedInteger('id_parametro_imovel_iptu');
            $table->foreign('id_parametro_imovel_iptu', 'tb_iptu_regra_previo_id_parametro_imovel_iptu_fkey')->references('id_parametro_imovel_iptu')->on('tb_parametros_imovel_iptu');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_iptu_regra_previo');
    }
};
