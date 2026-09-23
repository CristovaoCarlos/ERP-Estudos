<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_base_legal` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_base_legal', function (Blueprint $table) {
            $table->bigIncrements('id_base_legal');
            $table->text('descricao');
            $table->integer('id_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_base_legal');
    }
};
