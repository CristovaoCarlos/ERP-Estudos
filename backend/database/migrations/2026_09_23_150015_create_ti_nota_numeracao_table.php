<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_nota_numeracao` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_nota_numeracao', function (Blueprint $table) {
            $table->string('cod_numeracao', 1);
            $table->string('descricao', 20);
            $table->primary('cod_numeracao');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_nota_numeracao');
    }
};
