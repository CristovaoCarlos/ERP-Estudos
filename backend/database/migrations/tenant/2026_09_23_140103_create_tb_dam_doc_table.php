<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_dam_doc` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_dam_doc', function (Blueprint $table) {
            $table->bigIncrements('id_dam_doc');
            $table->unsignedBigInteger('id_dam')->nullable();
            $table->unsignedBigInteger('id_doc')->nullable();
            $table->index(['id_dam'], 'idx_dam_doc_id_dam');
            $table->index(['id_doc'], 'idx_tb_dam_doc_id_doc');
            $table->foreign('id_dam', 'tb_dam_doc_id_dam_fkey')->references('id_dam')->on('tb_dam');
            $table->foreign('id_doc', 'tb_dam_doc_id_doc_fkey')->references('id_doc')->on('tb_doc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_dam_doc');
    }
};
