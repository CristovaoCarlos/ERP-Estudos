<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_itbi` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_itbi', function (Blueprint $table) {
            $table->bigInteger('id_doc');
            $table->date('data_vencimento');
            $table->integer('id_transmitente')->nullable();
            $table->integer('natureza_transacao');
            $table->text('observacao')->nullable();
            $table->string('financiado', 1);
            $table->integer('tipo_financiamento')->nullable();
            $table->integer('tipo_instrumento');
            $table->string('cartorio_notas', 100)->nullable();
            $table->string('cartorio_notas_uf', 2)->nullable();
            $table->string('cartorio_notas_municipio', 100)->nullable();
            $table->string('transmitida_totalidade', 1);
            $table->decimal('porcao_transmitida', 18, 2)->nullable();
            $table->string('houve_corretagem', 1);
            $table->integer('id_cartorio');
            $table->string('matricula_cartorio', 20)->nullable();
            $table->decimal('valor_transacao', 18, 2)->nullable();
            $table->decimal('valor_financiado', 18, 2)->nullable();
            $table->integer('qtd_impressao')->nullable();
            $table->integer('id_imovel')->nullable();
            $table->integer('id_origem')->nullable()->comment('campo relacionado com o sincronismo');
            $table->primary('id_doc');
            $table->foreign('id_cartorio', 'tb_itbi_id_cartorio_fkey')->references('id_cartorio')->on('tb_cartorio');
            $table->foreign('id_imovel', 'tb_itbi_id_imovel_fkey')->references('id_imovel')->on('tb_imovel');
            $table->foreign('natureza_transacao', 'tb_itbi_natureza_transacao_fkey')->references('id_natureza_itbi')->on('tb_natureza_itbi');
            $table->foreign('id_doc', 'tb_itbi_tb_doc_fk')->references('id_doc')->on('tb_doc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_itbi');
    }
};
