<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tc_selic` do sistema legado (schema `tbcomuns`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tc_selic', function (Blueprint $table) {
            $table->integer('ano');
            $table->integer('mes');
            $table->decimal('valor', 18, 2)->nullable();
            $table->integer('id');
            $table->primary('id');
            $table->unique(['ano', 'mes'], 'tc_selic_ano_mes_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tc_selic');
    }
};
