<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_levantamento_drone` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_levantamento_drone', function (Blueprint $table) {
            $table->increments('id_levantamento');
            $table->integer('id_imovel');
            $table->integer('id_empresa');
            $table->string('nome_arquivo', 255)->nullable();
            $table->decimal('area_sq_meters', 14, 4)->nullable();
            $table->jsonb('polygon_coords');
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->unique(['id_imovel'], 'uq_levantamento_imovel');
            $table->index(['id_empresa'], 'idx_levantamento_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_levantamento_drone');
    }
};
