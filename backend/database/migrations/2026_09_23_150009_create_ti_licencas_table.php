<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_licencas` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_licencas', function (Blueprint $table) {
            $table->string('cnpj', 200);
            $table->string('sistema', 200);
            $table->string('modulo', 200);
            $table->string('nome_empresa', 200);
            $table->string('competencia_inicio', 50);
            $table->string('competencia_fim', 50);
            $table->string('hash', 32);
            $table->integer('id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_licencas');
    }
};
