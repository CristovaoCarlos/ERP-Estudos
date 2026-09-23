<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_contribuinte_representante` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_contribuinte_representante', function (Blueprint $table) {
            $table->increments('id_contribuinte_representante');
            $table->integer('id_contribuinte');
            $table->string('cpf_cnpj', 14);
            $table->string('nome_razao_social', 200);
            $table->string('tipo', 1);
            $table->unique(['id_contribuinte', 'cpf_cnpj'], 'tb_contribuinte_representante_id_contribuinte_cpf_cnpj_key');
            $table->foreign('id_contribuinte', 'tb_contribuinte_representante_contribuinte_id_fkey')->references('id_contribuinte')->on('tb_contribuinte');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_contribuinte_representante');
    }
};
