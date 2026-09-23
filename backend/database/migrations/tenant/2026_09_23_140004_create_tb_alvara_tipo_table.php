<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_alvara_tipo` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_alvara_tipo', function (Blueprint $table) {
            $table->increments('id_tipo_alvara');
            $table->string('descricao', 50);
            $table->integer('id_empresa')->nullable();
            $table->decimal('percent_area_terreno', 5, 2)->nullable();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_alvara_tipo');
    }
};
