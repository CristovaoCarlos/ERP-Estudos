<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_nfse_class_tributaria` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_nfse_class_tributaria', function (Blueprint $table) {
            $table->string('codigo', 10);
            $table->text('descricao');
            $table->primary('codigo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_nfse_class_tributaria');
    }
};
