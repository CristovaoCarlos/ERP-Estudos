<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_imovel_historico` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_imovel_historico', function (Blueprint $table) {
            $table->integer('id_historico');
            $table->integer('codigo_imovel');
            $table->string('tipo_historico', 20);
            $table->integer('id_documento')->nullable();
            $table->json('historico');
            $table->string('usuario', 20);
            $table->timestamp('data_hora');
            $table->primary('id_historico');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_imovel_historico');
    }
};
