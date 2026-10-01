<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_itbi_contribuintes` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_itbi_contribuintes', function (Blueprint $table) {
            $table->integer('id');
            $table->unsignedBigInteger('id_doc');
            $table->string('tipo', 1);
            $table->string('cpf_cnpj', 14);
            $table->string('nome', 200);
            $table->decimal('valor_pago_corretagem', 18, 2)->nullable();
            $table->primary('id');
            $table->foreign('id_doc', 'tb_itbi_contribuintes_id_itbi_fkey')->references('id_doc')->on('tb_itbi');
            $table->foreign('id_doc', 'tb_itbi_contribuintes_tb_itbi_fk')->references('id_doc')->on('tb_itbi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_itbi_contribuintes');
    }
};
