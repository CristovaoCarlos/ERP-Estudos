<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_cartorio` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_cartorio', function (Blueprint $table) {
            $table->bigIncrements('id_cartorio');
            $table->string('nome', 100);
            $table->integer('id_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_cartorio');
    }
};
