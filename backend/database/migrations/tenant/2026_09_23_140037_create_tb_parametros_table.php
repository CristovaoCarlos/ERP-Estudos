<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametros` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametros', function (Blueprint $table) {
            $table->bigIncrements('id_parametro');
            $table->string('usa_calendario', 1)->nullable();
            $table->binary('logomarca1')->nullable();
            $table->binary('logomarca2')->nullable();
            $table->string('logomarca1_nome', 100)->nullable();
            $table->string('logomarca2_nome', 100)->nullable();
            $table->unsignedBigInteger('id_empresa');
            $table->unsignedBigInteger('id_endereco')->nullable();
            $table->string('slogan', 150)->nullable();
            $table->string('site', 150)->nullable();
            $table->string('client_id', 80)->nullable();
            $table->string('client_secret', 80)->nullable();
            $table->text('access_token')->nullable();
            $table->timestamp('data_expiration_token')->nullable();
            $table->integer('integracao_adn')->nullable()->default(0)->comment('0- Desabilitado; 1- Produção; 2- Homologação');
            $table->unique(['id_empresa'], 'tb_parametros_unique');
            $table->foreign('id_empresa', 'tb_parametros_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
            $table->foreign('id_endereco', 'tb_parametros_id_endereco_fkey')->references('id_endereco')->on('tb_endereco');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametros');
    }
};
