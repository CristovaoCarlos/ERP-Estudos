<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `check_pix_api` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('check_pix_api', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('table_name', 50);
            $table->bigInteger('table_id');
            $table->text('pix_referencia');
            $table->string('cnpj_empresa', 14);
            $table->string('nr_convenio', 8)->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->string('resultado', 30)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('check_pix_api');
    }
};
