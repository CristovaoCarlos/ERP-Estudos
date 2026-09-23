<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_ufir` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_ufir', function (Blueprint $table) {
            $table->bigIncrements('id_ufir');
            $table->decimal('valor', 18, 4);
            $table->integer('id_empresa');
            $table->date('periodo_inicio');
            $table->date('periodo_fim')->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_ufir');
    }
};
