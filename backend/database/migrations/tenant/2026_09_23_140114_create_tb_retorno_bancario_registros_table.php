<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_retorno_bancario_registros` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_retorno_bancario_registros', function (Blueprint $table) {
            $table->integer('id_retorno_bancario');
            $table->integer('sequencial_registro');
            $table->string('tipo_registro', 1);
            $table->bigInteger('id_dam')->nullable();
            $table->string('tipo_dam', 50);
            $table->date('data_vencimento')->nullable();
            $table->date('data_pagamento');
            $table->decimal('valor_dam', 18, 2)->nullable();
            $table->decimal('valor_recebido', 18, 2);
            $table->string('status', 1);
            $table->text('erro')->nullable();
            $table->timestamp('data_hora');
            $table->string('usuario', 255);
            $table->binary('conteudo')->nullable();
            $table->increments('id_retorno_bancario_registros');
            $table->foreign('id_dam', 'tb_retorno_bancario_registros_id_dam_fkey')->references('id_dam')->on('tb_dam');
            $table->foreign('id_retorno_bancario', 'tb_retorno_bancario_registros_id_retorno_fkey')->references('id_retorno_bancario')->on('tb_retorno_bancario');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_retorno_bancario_registros');
    }
};
