<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_nfse_nbs` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_nfse_nbs', function (Blueprint $table) {
            $table->string('nbs_codigo', 20);
            $table->text('nbs_descricao');
            $table->primary('nbs_codigo');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_nfse_nbs');
    }
};
