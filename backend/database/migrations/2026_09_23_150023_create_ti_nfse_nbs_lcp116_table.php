<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_nfse_nbs_lcp116` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_nfse_nbs_lcp116', function (Blueprint $table) {
            $table->string('item_lcp116', 10);
            $table->string('nbs_codigo', 20);
            $table->primary(['item_lcp116', 'nbs_codigo']);
            $table->foreign('item_lcp116', 'ti_nfse_nbs_lcp116_item_lcp116_fkey')->references('codigo')->on('ti_lcp116');
            $table->foreign('nbs_codigo', 'ti_nfse_nbs_lcp116_nbs_codigo_fkey')->references('nbs_codigo')->on('ti_nfse_nbs');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_nfse_nbs_lcp116');
    }
};
