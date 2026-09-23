<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_parametro_habite` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_parametro_habite', function (Blueprint $table) {
            $table->bigIncrements('id_parametro_habite');
            $table->string('tipo_calculo', 1)->default('M')->comment('M - Manual A - Automatico');
            $table->string('cobrar_tx_expediente', 1)->default('N');
            $table->text('texto1')->nullable();
            $table->text('texto2')->nullable();
            $table->string('assinatura_1', 100)->nullable();
            $table->string('assinatura_2', 100)->nullable();
            $table->string('imp_apos_pagamento', 1);
            $table->text('imp_apos_pagamento_te');
            $table->string('vencimento_tipo', 1)->nullable()->comment('B - Dia base\\nA - Dias após emissão');
            $table->integer('vencimento_valor')->nullable()->comment('Para B: aceita valores de 1 - 31');
            $table->bigInteger('id_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_parametro_habite');
    }
};
