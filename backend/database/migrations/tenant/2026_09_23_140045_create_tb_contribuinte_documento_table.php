<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_contribuinte_documento` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_contribuinte_documento', function (Blueprint $table) {
            $table->bigIncrements('id_contribuinte_documento');
            $table->integer('id_contribuinte');
            $table->integer('id_tipo_documento');
            $table->string('numero_doc', 30);
            $table->unique(['id_contribuinte', 'id_tipo_documento', 'numero_doc'], 'tb_contribuinte_documento_id_contribuinte_id_tipo_documento_key');
            $table->foreign('id_contribuinte', 'tb_contribuinte_documento_id_contribuinte_fkey')->references('id_contribuinte')->on('tb_contribuinte');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_contribuinte_documento');
    }
};
