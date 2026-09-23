<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_processing_msg` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_processing_msg', function (Blueprint $table) {
            $table->bigInteger('id');
            $table->timestamp('created_at');
            $table->string('message_type', 7)->nullable();
            $table->text('message')->nullable();
            $table->bigInteger('tb_processing_id');
            $table->primary('id');
            $table->index(['tb_processing_id'], 'idx_tb_processing_msg_processing');
            $table->index(['tb_processing_id', 'id'], 'idx_tb_processing_msg_processing_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_processing_msg');
    }
};
