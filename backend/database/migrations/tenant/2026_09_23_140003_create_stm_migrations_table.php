<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `stm_migrations` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stm_migrations', function (Blueprint $table) {
            $table->increments('id');
            $table->text('filename');
            $table->timestamp('applied_at')->useCurrent();
            $table->text('checksum')->nullable();
            $table->unique(['filename'], 'stm_migrations_filename_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stm_migrations');
    }
};
