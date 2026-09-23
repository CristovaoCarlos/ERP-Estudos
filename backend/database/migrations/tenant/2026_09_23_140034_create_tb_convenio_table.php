<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_convenio` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_convenio', function (Blueprint $table) {
            $table->increments('id_convenio');
            $table->date('data');
            $table->integer('id_banco');
            $table->string('banco_agencia', 100)->nullable();
            $table->string('tipo', 8)->nullable();
            $table->string('febraban_produto', 1)->nullable();
            $table->string('febraban_segmento', 1)->nullable();
            $table->string('febraban_valor', 1)->nullable();
            $table->string('febraban_empresa', 4)->nullable();
            $table->string('numero_convenio', 8)->nullable();
            $table->string('bacen_agencia', 5)->nullable();
            $table->string('bacen_agencia_dv', 1)->nullable();
            $table->string('bacen_conta', 8)->nullable();
            $table->string('bacen_conta_dv', 1)->nullable();
            $table->string('bacen_cedente', 8)->nullable();
            $table->string('bacen_cedente_dv', 1)->nullable();
            $table->string('bacen_carteira', 2)->nullable();
            $table->string('pix', 1);
            $table->integer('id_empresa');
            $table->string('descricao', 255)->nullable();
            $table->integer('id_origem')->nullable();
            $table->foreign('id_empresa', 'tb_convenio_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_convenio');
    }
};
