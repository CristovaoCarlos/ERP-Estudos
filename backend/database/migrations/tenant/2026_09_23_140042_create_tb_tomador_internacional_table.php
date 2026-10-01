<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_tomador_internacional` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_tomador_internacional', function (Blueprint $table) {
            $table->bigIncrements('id_tomador_internacional');
            $table->string('razao_social', 255);
            $table->string('endereco', 255)->nullable();
            $table->bigInteger('id_pais_origem');
            $table->string('email', 255);
            $table->string('numero_identificacao_fiscal', 9)->nullable();
            $table->unsignedBigInteger('id_empresa')->nullable();
            $table->string('endereco_postal', 50)->nullable();
            $table->string('cidade', 255)->nullable();
            $table->string('estado_provincia', 255)->nullable();
            $table->foreign('id_empresa', 'tb_tomador_internacional_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_tomador_internacional');
    }
};
