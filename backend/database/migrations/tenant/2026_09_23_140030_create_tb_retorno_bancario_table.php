<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_retorno_bancario` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_retorno_bancario', function (Blueprint $table) {
            $table->increments('id_retorno_bancario');
            $table->string('banco', 3);
            $table->string('numero_convenio', 6);
            $table->string('sequencial_arquivo', 6);
            $table->string('nome_arquivo', 100);
            $table->string('leiaute_arquivo', 100);
            $table->integer('qtd_registros');
            $table->string('status', 1);
            $table->timestamp('data_hora');
            $table->string('usuario', 255);
            $table->binary('conteudo')->nullable();
            $table->integer('id_empresa');
            $table->text('id_origem')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_retorno_bancario');
    }
};
