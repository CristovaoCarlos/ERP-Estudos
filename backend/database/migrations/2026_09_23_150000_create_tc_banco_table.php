<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tc_banco` do sistema legado (schema `tbcomuns`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tc_banco', function (Blueprint $table) {
            $table->increments('id_banco');
            $table->string('codigo', 4);
            $table->string('descricao', 100);
            $table->unique(['codigo'], 'tc_banco_codigo_key');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tc_banco');
    }
};
