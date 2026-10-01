<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_negociacao` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_negociacao', function (Blueprint $table) {
            $table->increments('id_negociacao');
            $table->integer('id_dam');
            $table->unsignedBigInteger('id_empresa');
            $table->integer('id_usuario_acao');
            $table->string('responsavel', 150);
            $table->text('descricao')->nullable();
            $table->binary('documento');
            $table->foreign('id_empresa', 'tb_negociacao_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_negociacao');
    }
};
