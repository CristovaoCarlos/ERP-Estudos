<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_tomador` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_tomador', function (Blueprint $table) {
            $table->increments('id_tomador');
            $table->string('tipo', 1);
            $table->string('nome', 150);
            $table->integer('id_logradouro')->nullable();
            $table->string('cpf_cnpj', 14);
            $table->string('email', 100)->nullable();
            $table->string('orgao_publico', 1);
            $table->string('gestor_nome', 100)->nullable();
            $table->string('gestor_cargo', 100)->nullable();
            $table->string('telefone', 20)->nullable();
            $table->integer('id_empresa');
            $table->integer('id_origem')->nullable();
            $table->foreign('id_empresa', 'tb_tomador_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
            $table->foreign('id_logradouro', 'tb_tomador_id_logradouro_fkey')->references('id_endereco')->on('tb_endereco');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_tomador');
    }
};
