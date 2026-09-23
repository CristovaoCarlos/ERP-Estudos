<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_tipo_documento` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_tipo_documento', function (Blueprint $table) {
            $table->bigIncrements('id_tipo_documento');
            $table->string('descricao', 50);
            $table->string('detalhamento', 100);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_tipo_documento');
    }
};
