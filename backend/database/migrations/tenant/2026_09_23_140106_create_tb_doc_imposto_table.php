<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_doc_imposto` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_doc_imposto', function (Blueprint $table) {
            $table->bigIncrements('id_doc_imposto');
            $table->bigInteger('id_doc');
            $table->bigInteger('id_receita');
            $table->string('tipo_valor', 1);
            $table->decimal('valor', 18, 2);
            $table->decimal('referencia', 18, 2);
            $table->index(['id_doc'], 'idx_doc_imposto_id_doc');
            $table->foreign('id_doc', 'tb_doc_imposto_tb_doc_fk')->references('id_doc')->on('tb_doc');
            $table->foreign('id_receita', 'tb_doc_imposto_tb_receita_fk')->references('id_receita')->on('tb_receita');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_doc_imposto');
    }
};
