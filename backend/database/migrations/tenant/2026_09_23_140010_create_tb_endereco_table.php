<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_endereco` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_endereco', function (Blueprint $table) {
            $table->bigIncrements('id_endereco');
            $table->string('numero', 50)->nullable();
            $table->integer('id_cidade');
            $table->string('logradouro', 255);
            $table->text('complemento')->nullable();
            $table->string('uf', 2);
            $table->string('cep', 9);
            $table->string('bairro', 200)->nullable();
            $table->index(['id_endereco', 'id_cidade'], 'idx_tb_endereco_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_endereco');
    }
};
