<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_isencao` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_isencao', function (Blueprint $table) {
            $table->increments('id_isencao');
            $table->string('descricao', 100);
            $table->integer('id_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_isencao');
    }
};
