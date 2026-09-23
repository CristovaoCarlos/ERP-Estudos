<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_contribuinte_situacao` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_contribuinte_situacao', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->integer('contribuinte_id');
            $table->string('situacao_codigo', 2);
            $table->string('situacao_motivo_codigo', 2);
            $table->date('data');
            $table->string('observacao', 500);
            $table->foreign('contribuinte_id', 'tb_contribuinte_situacao_id_contribuinte')->references('id_contribuinte')->on('tb_contribuinte');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_contribuinte_situacao');
    }
};
