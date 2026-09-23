<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_fator` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_fator', function (Blueprint $table) {
            $table->string('fator', 20);
            $table->string('descricao', 200);
            $table->string('subtipo', 1);
            $table->primary('fator');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_fator');
    }
};
