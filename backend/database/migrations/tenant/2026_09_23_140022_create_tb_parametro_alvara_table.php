<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Query\Expression;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametro_alvara` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametro_alvara', function (Blueprint $table) {
            $table->bigIncrements('id_parametro_alvara');
            $table->string('cobrar_taxa', 1);
            $table->string('assinatura_1', 100)->nullable();
            $table->string('assinatura_2', 100)->nullable();
            $table->string('imp_apos_pagamento', 1);
            $table->text('imp_apos_pagamento_te');
            $table->string('vencimento_tipo', 1)->nullable()->comment('B - Dia base A - Dias após emissão');
            $table->integer('vencimento_valor')->nullable()->comment('Para B: aceita valores de 1 - 31');
            $table->bigInteger('id_empresa');
            $table->text('formula')->nullable()->default(new Expression("('TAXA')")); // TEXT só aceita default como expressão no MySQL
            $table->string('calculo_progressivo', 1)->nullable()->default('N');
            $table->string('cargo_1', 120)->nullable();
            $table->string('cargo_2', 120)->nullable();
            $table->text('observacao')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametro_alvara');
    }
};
