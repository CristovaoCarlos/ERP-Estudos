<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `mq_queues` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('mq_queues', function (Blueprint $table) {
            $table->increments('id');
            $table->string('name', 255);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mq_queues');
    }
};
