<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_tomador_contrib` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_tomador_contrib', function (Blueprint $table) {
            $table->bigIncrements('id_tomador_contrib');
            $table->unsignedBigInteger('id_contribuinte');
            $table->unsignedInteger('id_tomador');
            $table->foreign('id_contribuinte', 'tb_tomador_contrib_id_contribuinte_fkey')->references('id_contribuinte')->on('tb_contribuinte');
            $table->foreign('id_tomador', 'tb_tomador_contrib_id_tomador_fkey')->references('id_tomador')->on('tb_tomador');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_tomador_contrib');
    }
};
