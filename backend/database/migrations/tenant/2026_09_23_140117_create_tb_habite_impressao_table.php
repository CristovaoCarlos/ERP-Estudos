<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_habite_impressao` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_habite_impressao', function (Blueprint $table) {
            $table->unsignedBigInteger('id_habite');
            $table->date('data_lancamento')->nullable();
            $table->integer('id_contribuinte')->nullable();
            $table->string('nome_contribuinte', 150)->nullable();
            $table->string('cpf_cnpj', 14)->nullable();
            $table->string('responsavel_tecnico', 200)->nullable();
            $table->string('crea_num', 50)->nullable();
            $table->string('crea_uf', 2)->nullable();
            $table->string('obra_nome', 150)->nullable();
            $table->integer('id_logradouro')->nullable();
            $table->string('logradouro', 100)->nullable();
            $table->string('numero', 50)->nullable();
            $table->text('complemento')->nullable();
            $table->string('bairro', 50)->nullable();
            $table->string('cep', 9)->nullable();
            $table->string('numero_alvara', 40);
            $table->decimal('obra_area_total', 18, 2)->nullable();
            $table->integer('obra_qtd_unidades')->nullable();
            $table->string('obra_art', 30)->nullable();
            $table->date('obra_data_inicial')->nullable();
            $table->date('obra_data_final')->nullable();
            $table->text('especificacao')->nullable();
            $table->text('observacao')->nullable();
            $table->integer('id_empresa')->nullable();
            $table->string('uf', 2)->nullable();
            $table->string('cidade', 100)->nullable();
            $table->primary('id_habite');
            $table->foreign('id_habite', 'tb_habite_impressao_id_habite_fkey')->references('id_doc')->on('tb_habite');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_habite_impressao');
    }
};
