<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_inss` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_inss', function (Blueprint $table) {
            $table->increments('id_inss');
            $table->decimal('aliquota', 18, 4);
            $table->decimal('valor_teto', 18, 2);
            $table->integer('id_empresa');
            $table->date('data');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_inss');
    }
};
