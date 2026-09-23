<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tc_cidade` do sistema legado (schema `tbcomuns`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tc_cidade', function (Blueprint $table) {
            $table->integer('id_cidade');
            $table->string('codigo', 7);
            $table->string('descricao', 100);
            $table->string('uf', 2);
            $table->primary('id_cidade');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tc_cidade');
    }
};
