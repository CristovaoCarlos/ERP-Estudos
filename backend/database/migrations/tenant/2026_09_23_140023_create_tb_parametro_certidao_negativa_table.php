<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametro_certidao_negativa` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametro_certidao_negativa', function (Blueprint $table) {
            $table->bigIncrements('id_parametro_certidao_negativa');
            $table->integer('certidao_validade')->default(90);
            $table->integer('certidao_prox_numero');
            $table->integer('id_modelo_certidao_negativa');
            $table->string('assinatura_1', 100)->nullable();
            $table->string('assinatura_2', 100)->nullable();
            $table->bigInteger('id_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametro_certidao_negativa');
    }
};
