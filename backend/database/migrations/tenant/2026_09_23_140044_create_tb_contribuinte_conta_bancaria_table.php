<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_contribuinte_conta_bancaria` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_contribuinte_conta_bancaria', function (Blueprint $table) {
            $table->bigIncrements('id_contribuinte_conta_bancaria');
            $table->unsignedBigInteger('id_contribuinte');
            $table->integer('id_banco');
            $table->string('agencia', 15);
            $table->string('operacao', 4)->nullable();
            $table->string('conta', 15);
            $table->foreign('id_contribuinte', 'tb_contribuinte_conta_bancaria_id_contribuinte_fkey')->references('id_contribuinte')->on('tb_contribuinte');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_contribuinte_conta_bancaria');
    }
};
