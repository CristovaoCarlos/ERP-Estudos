<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_contribuinte_servico` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_contribuinte_servico', function (Blueprint $table) {
            $table->bigIncrements('id_cotrib_serv');
            $table->integer('id_contribuinte');
            $table->integer('id_servico');
            $table->decimal('iss_aliquota', 18, 2)->nullable();
            $table->string('inss_cobranca', 1)->nullable();
            $table->decimal('inss_deducao', 18, 2)->nullable();
            $table->decimal('ir_deducao', 18, 2)->nullable();
            $table->string('taxa_cobranca', 1)->nullable();
            $table->decimal('reducao_base_calculo', 18, 2)->nullable();
            $table->text('observacao')->nullable();
            $table->unique(['id_contribuinte', 'id_servico'], 'tb_contribuinte_servico_id_contribuinte_id_servico_key');
            $table->foreign('id_contribuinte', 'tb_contribuinte_servico_id_contribuinte_fkey')->references('id_contribuinte')->on('tb_contribuinte');
            $table->foreign('id_servico', 'tb_contribuinte_servico_id_servico_fkey')->references('id_servico')->on('tb_servico');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_contribuinte_servico');
    }
};
