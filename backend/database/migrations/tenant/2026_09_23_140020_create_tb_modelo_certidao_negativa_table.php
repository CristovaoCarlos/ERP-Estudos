<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_modelo_certidao_negativa` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_modelo_certidao_negativa', function (Blueprint $table) {
            $table->increments('id_modelo_certidao');
            $table->string('titulo', 255);
            $table->text('legislacao');
            $table->integer('id_empresa');
            $table->integer('id_origem')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_modelo_certidao_negativa');
    }
};
