<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_servico` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_servico', function (Blueprint $table) {
            $table->bigIncrements('id_servico');
            $table->string('codigo_servico', 5);
            $table->text('descricao');
            $table->decimal('iss_aliquota', 18, 2);
            $table->string('inss_cobranca', 1);
            $table->decimal('inss_deducao', 18, 2)->nullable();
            $table->decimal('ir_deducao', 18, 2)->nullable();
            $table->string('taxa_cobranca', 1);
            $table->decimal('reducao_base_calculo', 18, 2);
            $table->text('observacao')->nullable();
            $table->integer('id_empresa');
            $table->unique(['codigo_servico', 'id_empresa'], 'tb_servico_codigo_servico_id_empresa_key');
            $table->foreign('id_empresa', 'tb_servico_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_servico');
    }
};
