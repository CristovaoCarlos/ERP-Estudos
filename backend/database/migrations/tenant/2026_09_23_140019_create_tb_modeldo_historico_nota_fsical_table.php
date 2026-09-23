<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_modeldo_historico_nota_fsical` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_modeldo_historico_nota_fsical', function (Blueprint $table) {
            $table->increments('id_modelo_historico_nota');
            $table->string('titulo', 100);
            $table->text('descricao');
            $table->bigInteger('id_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_modeldo_historico_nota_fsical');
    }
};
