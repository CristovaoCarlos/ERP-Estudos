<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `trigger_log` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('trigger_log', function (Blueprint $table) {
            $table->bigIncrements('log_id');
            $table->string('trigger_name', 255)->nullable();
            $table->text('message')->nullable();
            $table->timestamp('created_at')->nullable()->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('trigger_log');
    }
};
