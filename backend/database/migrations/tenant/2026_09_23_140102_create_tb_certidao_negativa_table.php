<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_certidao_negativa` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_certidao_negativa', function (Blueprint $table) {
            $table->increments('id_certidao');
            $table->integer('numero_certidao');
            $table->date('validade')->nullable();
            $table->string('resultado', 1);
            $table->text('legislacao')->nullable();
            $table->string('codigo_autenticidade', 32);
            $table->timestamp('data_hora_emissao');
            $table->string('usuario', 255);
            $table->unsignedBigInteger('id_contribuinte');
            $table->integer('versao_relatorio');
            $table->unsignedBigInteger('id_empresa')->nullable();
            $table->string('titulo', 100)->nullable();
            $table->unsignedBigInteger('id_imovel')->nullable();
            $table->foreign('id_contribuinte', 'tb_certidao_negativa_id_contribuinte_fkey')->references('id_contribuinte')->on('tb_contribuinte');
            $table->foreign('id_empresa', 'tb_certidao_negativa_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
            $table->foreign('id_imovel', 'tb_certidao_negativa_id_imovel_fkey')->references('id_imovel')->on('tb_imovel');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_certidao_negativa');
    }
};
