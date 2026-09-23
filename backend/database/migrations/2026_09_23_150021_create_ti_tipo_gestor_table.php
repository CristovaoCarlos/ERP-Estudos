<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_tipo_gestor` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_tipo_gestor', function (Blueprint $table) {
            $table->integer('id_tipo_gestor');
            $table->string('descricao', 100);
            $table->string('codigo', 3);
            $table->primary('id_tipo_gestor');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_tipo_gestor');
    }
};
