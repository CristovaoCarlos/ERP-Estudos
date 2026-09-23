<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `ti_nfse_relacao_tributacao` do sistema legado (schema `tbinternas`), no banco central: vale para todas as prefeituras.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ti_nfse_relacao_tributacao', function (Blueprint $table) {
            $table->increments('id');
            $table->string('item_lcp116', 10);
            $table->string('nbs_codigo', 20);
            $table->string('indop', 10);
            $table->string('cclasstrib', 10);
            $table->foreign('cclasstrib', 'ti_nfse_relacao_tributacao_cclasstrib_fkey')->references('codigo')->on('ti_nfse_class_tributaria');
            $table->foreign('indop', 'ti_nfse_relacao_tributacao_indop_fkey')->references('codigo')->on('ti_nfse_indop');
            $table->foreign('item_lcp116', 'ti_nfse_relacao_tributacao_item_lcp116_fkey')->references('codigo')->on('ti_lcp116');
            $table->foreign('nbs_codigo', 'ti_nfse_relacao_tributacao_nbs_codigo_fkey')->references('nbs_codigo')->on('ti_nfse_nbs');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ti_nfse_relacao_tributacao');
    }
};
