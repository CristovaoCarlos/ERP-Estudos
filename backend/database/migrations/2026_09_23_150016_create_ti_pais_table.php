<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_pais` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_pais', function (Blueprint $table) {
            $table->bigIncrements('id_pais');
            $table->string('codigo', 4);
            $table->string('descricao', 255);
            $table->timestamp('created_at')->nullable()->useCurrent();
            $table->timestamp('updated_at')->nullable();
            $table->unique(['codigo'], 'ti_pais_codigo_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_pais');
    }
};
