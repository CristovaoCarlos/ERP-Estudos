<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_contribuinte_cnae` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_contribuinte_cnae', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->integer('id_contribuinte');
            $table->integer('codigo_cnae');
            $table->string('principal', 1)->nullable()->comment('S- Sim, N- Não');
            $table->unique(['id_contribuinte', 'codigo_cnae'], 'tb_contribuinte_cnae_id_contribuinte_codigo_cnae_key');
            $table->foreign('id_contribuinte', 'tb_contribuinte_cnae_contribuinte_id_fkey')->references('id_contribuinte')->on('tb_contribuinte');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_contribuinte_cnae');
    }
};
