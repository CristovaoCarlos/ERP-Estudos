<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_processing` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_processing', function (Blueprint $table) {
            $table->bigInteger('id');
            $table->string('name_process', 255);
            $table->timestamp('created_at');
            $table->timestamp('start_processing')->nullable();
            $table->timestamp('end_processing')->nullable();
            $table->string('status', 24)->nullable();
            $table->integer('id_empresa')->nullable();
            $table->jsonb('parametros')->nullable();
            $table->bigInteger('iptu_lote_id')->nullable();
            $table->primary('id');
            $table->index(['id_empresa', 'iptu_lote_id', 'id'], 'idx_tb_processing_iptu_lote');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_processing');
    }
};
