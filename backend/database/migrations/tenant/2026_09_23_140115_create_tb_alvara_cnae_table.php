<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_alvara_cnae` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_alvara_cnae', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->bigInteger('id_doc');
            $table->integer('cnae');
            $table->string('descricao', 200);
            $table->string('principal', 1);
            $table->foreign('id_doc', 'tb_alvara_cnae_alvara_id_fkey')->references('id_doc')->on('tb_alvara');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_alvara_cnae');
    }
};
