<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_doc` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_doc', function (Blueprint $table) {
            $table->bigIncrements('id_doc');
            $table->integer('tipo');
            $table->unsignedBigInteger('id_empresa');
            $table->unsignedBigInteger('id_contribuinte');
            $table->date('data_cancelamento')->nullable();
            $table->text('motivo_cancelamento')->nullable();
            $table->date('data_lancamento');
            $table->string('status', 1)->comment('L - Lançado; E - Emitido; C - Cancelado;');
            $table->unsignedBigInteger('id_base_legal')->nullable();
            $table->decimal('base_calculo', 18, 2)->default(0.00);
            $table->decimal('valor_total', 18, 2)->default(0.00);
            $table->text('observacao')->nullable();
            $table->index(['tipo'], 'fki_tb_doc_tipo_cod_dam_tipo_fk');
            $table->index(['id_empresa', 'tipo'], 'idx_tb_doc_empresa_tipo');
            $table->index(['id_empresa', 'tipo', 'id_doc'], 'idx_tb_doc_empresa_tipo_doc');
            $table->foreign('id_base_legal', 'tb_doc_tb_base_legal_fk')->references('id_base_legal')->on('tb_base_legal');
            $table->foreign('id_contribuinte', 'tb_doc_tb_contribuinte_fk')->references('id_contribuinte')->on('tb_contribuinte');
            $table->foreign('id_empresa', 'tb_doc_tb_empresa_fk')->references('id_empresa')->on('tb_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_doc');
    }
};
