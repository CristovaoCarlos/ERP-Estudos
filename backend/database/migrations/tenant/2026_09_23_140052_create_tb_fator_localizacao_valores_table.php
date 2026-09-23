<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_fator_localizacao_valores` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_fator_localizacao_valores', function (Blueprint $table) {
            $table->bigIncrements('id_fator_localizacao_valores');
            $table->decimal('valor', 18, 2)->nullable();
            $table->integer('id_fator_localizacao')->nullable();
            $table->integer('id_parametro_imovel_iptu');
            $table->unique(['id_parametro_imovel_iptu', 'id_fator_localizacao'], 'tb_fator_localizacao_valores_id_parametro_imovel_iptu_id_fa_key');
            $table->foreign('id_fator_localizacao', 'tb_fator_localizacao_valores_id_fator_localizacao_fkey')->references('id_fator_localizacao')->on('tb_fator_localizacao');
            $table->foreign('id_parametro_imovel_iptu', 'tb_fator_localizacao_valores_id_parametro_imovel_iptu_fkey')->references('id_parametro_imovel_iptu')->on('tb_parametros_imovel_iptu');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_fator_localizacao_valores');
    }
};
