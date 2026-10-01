<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_itbi_impressao` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_itbi_impressao', function (Blueprint $table) {
            $table->unsignedBigInteger('id_doc');
            $table->date('data_lancamento')->nullable();
            $table->integer('id_contribuinte')->nullable();
            $table->text('nome_adquirente')->nullable();
            $table->string('cpf_cnpj_adquirente', 14)->nullable();
            $table->text('logradouro_adquirente')->nullable();
            $table->integer('id_transmitente')->nullable();
            $table->text('nome_transmitente')->nullable();
            $table->text('cpd_cnpj_transmitente')->nullable();
            $table->text('nome_logradouro_transmitente')->nullable();
            $table->integer('id_imovel')->nullable();
            $table->integer('inscricao_distrito')->nullable();
            $table->integer('inscricao_setor')->nullable();
            $table->integer('inscricao_quadra')->nullable();
            $table->integer('inscricao_lote')->nullable();
            $table->integer('inscricao_unidade')->nullable();
            $table->decimal('area_terreno', 18, 2)->nullable();
            $table->decimal('area_unidade', 18, 2)->nullable();
            $table->decimal('fracao_ideal', 18, 2)->nullable();
            $table->text('nome_logradouro_imovel')->nullable();
            $table->integer('fator_ocupacao')->nullable();
            $table->integer('fator_utilizacao')->nullable();
            $table->integer('fator_caracterizacao')->nullable();
            $table->integer('natureza_transacao')->nullable();
            $table->text('nome_natureza')->nullable();
            $table->decimal('valor_transacao', 18, 2)->nullable();
            $table->decimal('valor_financiado', 18, 2)->nullable();
            $table->text('tipo_instrumento')->nullable();
            $table->text('cartorio_notas')->nullable();
            $table->string('cartorio_notas_uf', 2)->nullable();
            $table->text('matricula_cartorio')->nullable();
            $table->integer('id_cartorio')->nullable();
            $table->text('nome_cartorio')->nullable();
            $table->integer('id_empresa')->nullable();
            $table->primary('id_doc');
            $table->foreign('id_doc', 'tb_itbi_impressao_tb_itbi_fk')->references('id_doc')->on('tb_itbi');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_itbi_impressao');
    }
};
