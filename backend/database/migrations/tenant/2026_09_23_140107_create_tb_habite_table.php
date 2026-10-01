<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_habite` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_habite', function (Blueprint $table) {
            $table->unsignedBigInteger('id_doc');
            $table->string('tipo', 1);
            $table->date('data_vencimento');
            $table->string('obra_nome', 200);
            $table->string('obra_art', 30)->nullable();
            $table->decimal('obra_area_total', 18, 2);
            $table->integer('obra_qtd_unidades');
            $table->date('obra_data_inicial');
            $table->date('obra_data_final')->nullable();
            $table->unsignedBigInteger('id_logradouro');
            $table->string('responsavel_tecnico', 200);
            $table->string('crea_num', 50);
            $table->string('crea_uf', 2);
            $table->text('especificacao');
            $table->text('observacao')->nullable();
            $table->integer('qtd_impressao')->nullable();
            $table->integer('id_origem')->nullable();
            $table->string('numero_alvara', 40);
            $table->primary('id_doc');
            $table->foreign('id_logradouro', 'tb_habite_id_logradouro_fkey')->references('id_endereco')->on('tb_endereco');
            $table->foreign('id_doc', 'tb_habite_tb_doc_fk')->references('id_doc')->on('tb_doc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_habite');
    }
};
