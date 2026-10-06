<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `mq_messages` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mq_messages', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->timestamp('creation_date')->nullable();
            $table->timestamp('delivery_date')->nullable();
            $table->integer('queue_id')->nullable();
            $table->integer('status');
            $table->binary('body')->nullable();
            $table->integer('version');
            $table->string('reference', 255)->nullable();
            $table->integer('deliveries')->nullable();
            $table->integer('priority')->nullable()->default(0);
            $table->index(['queue_id', 'status', 'priority'], 'ix_mqmessages_priority');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mq_messages');
    }
};
