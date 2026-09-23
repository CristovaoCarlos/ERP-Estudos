<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_segmentos` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_segmentos', function (Blueprint $table) {
            $table->string('codigo', 1);
            $table->string('descricao', 50);
            $table->primary('codigo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_segmentos');
    }
};
