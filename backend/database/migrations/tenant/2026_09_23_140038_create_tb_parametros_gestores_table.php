<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametros_gestores` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametros_gestores', function (Blueprint $table) {
            $table->unsignedBigInteger('id_empresa');
            $table->integer('id_user');
            $table->string('cargo_descricao', 255)->nullable();
            $table->string('responsavel', 255)->nullable();
            $table->string('principal', 1)->nullable();
            $table->foreign('id_empresa', 'tb_parametros_gestores_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametros_gestores');
    }
};
