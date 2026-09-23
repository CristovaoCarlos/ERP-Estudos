<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_dam_tipo` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_dam_tipo', function (Blueprint $table) {
            $table->integer('cod_dam_tipo');
            $table->string('descricao', 20);
            $table->primary('cod_dam_tipo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_dam_tipo');
    }
};
