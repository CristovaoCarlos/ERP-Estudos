<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_fator_itens` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_fator_itens', function (Blueprint $table) {
            $table->integer('id_item');
            $table->string('fator', 20);
            $table->integer('cod_item');
            $table->string('descricao', 200);
            $table->primary('id_item');
            $table->unique(['fator', 'cod_item'], 'ti_fator_itens_fator_cod_item_key');
            $table->foreign('fator', 'ti_fator_itens_fator_fkey')->references('fator')->on('ti_fator');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_fator_itens');
    }
};
