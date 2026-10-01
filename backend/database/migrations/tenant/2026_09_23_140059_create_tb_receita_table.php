<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_receita` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_receita', function (Blueprint $table) {
            $table->bigIncrements('id_receita');
            $table->string('descricao', 100);
            $table->string('valor_tipo', 1)->nullable();
            $table->decimal('valor', 18, 2)->nullable();
            $table->string('possui_teto', 1);
            $table->decimal('valor_teto', 18, 2)->nullable();
            $table->unsignedInteger('id_convenio')->nullable();
            $table->unsignedBigInteger('id_empresa');
            $table->string('codigo_stn', 10)->nullable();
            $table->string('sigla', 15)->nullable();
            $table->integer('id_origem')->nullable();
            $table->foreign('id_convenio', 'tb_receita_id_convenio_fkey')->references('id_convenio')->on('tb_convenio');
            $table->foreign('id_empresa', 'tb_receita_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_receita');
    }
};
