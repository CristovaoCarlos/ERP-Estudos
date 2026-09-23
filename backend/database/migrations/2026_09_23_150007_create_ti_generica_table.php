<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_generica` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_generica', function (Blueprint $table) {
            $table->integer('id');
            $table->string('tabela', 50);
            $table->integer('codigo');
            $table->string('descricao', 200);
            $table->primary('id');
            $table->unique(['tabela', 'codigo'], 'ti_generica_tabela_codigo_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_generica');
    }
};
