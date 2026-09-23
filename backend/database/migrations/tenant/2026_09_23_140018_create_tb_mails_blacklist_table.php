<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_mails_blacklist` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_mails_blacklist', function (Blueprint $table) {
            $table->string('mail', 255);
            $table->string('app_name', 100);
            $table->text('validation_app');
            $table->string('status_api', 10);
            $table->integer('attempts');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->primary('mail');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_mails_blacklist');
    }
};
