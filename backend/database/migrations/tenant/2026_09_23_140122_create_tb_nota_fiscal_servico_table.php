<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_nota_fiscal_servico` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_nota_fiscal_servico', function (Blueprint $table) {
            $table->increments('id_nota_fiscal_servico');
            $table->unsignedBigInteger('id_doc');
            $table->string('prestado_no_pais', 1)->default('S');
            $table->string('codigo_municipio', 7)->nullable();
            $table->string('codigo_pais', 4)->nullable();
            $table->string('codigo_cnae', 7)->nullable();
            $table->string('discriminacao', 2000);
            $table->decimal('valor', 18, 2);
            $table->decimal('quantidade', 18, 4);
            $table->decimal('valor_total', 18, 2);
            $table->decimal('desconto_incondicionado', 18, 2)->default(0);
            $table->decimal('valor_deducoes', 18, 2)->default(0);
            $table->decimal('iss_base_calculo', 18, 2)->default(0);
            $table->decimal('iss_aliquota', 6, 4)->default(0);
            $table->decimal('iss_valor', 18, 2)->default(0);
            $table->decimal('desconto_condicionado', 18, 2)->default(0);
            $table->string('unidade', 10)->nullable();
            $table->foreign('id_doc', 'tb_nota_fiscal_servico_id_nota_fiscal_fkey')->references('id_doc')->on('tb_nota_fiscal');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_nota_fiscal_servico');
    }
};
