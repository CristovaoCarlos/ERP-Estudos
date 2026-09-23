<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_alvara` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_alvara', function (Blueprint $table) {
            $table->bigInteger('id_doc');
            $table->date('data_vencimento');
            $table->date('data_inicio');
            $table->date('data_fim');
            $table->integer('id_tipo_alvara');
            $table->text('observacao')->nullable();
            $table->integer('qtd_impressao')->nullable();
            $table->string('horario_funcionamento_sem', 31)->nullable();
            $table->string('horario_funcionamento_sab', 31)->nullable();
            $table->string('horario_funcionamento_dom', 31)->nullable();
            $table->integer('id_origem')->nullable();
            $table->string('usa_imovel', 1)->default('N');
            $table->bigInteger('id_imovel')->nullable();
            $table->string('obra_endereco', 255)->nullable();
            $table->string('obra_autor_projeto', 180)->nullable();
            $table->string('obra_autor_cau', 30)->nullable();
            $table->string('obra_resp_tecnico', 180)->nullable();
            $table->string('obra_resp_tecnico_crea', 30)->nullable();
            $table->string('obra_responsavel_firma', 180)->nullable();
            $table->string('obra_responsavel_firma_cpf_cnpj', 20)->nullable();
            $table->text('obra_especificacao')->nullable();
            $table->text('obra_observacao')->nullable();
            $table->text('obra_finalidade')->nullable();
            $table->primary('id_doc');
            $table->foreign('id_imovel', 'tb_alvara_id_imovel_fkey')->references('id_imovel')->on('tb_imovel');
            $table->foreign('id_tipo_alvara', 'tb_alvara_id_tipo_alvara_fkey')->references('id_tipo_alvara')->on('tb_alvara_tipo');
            $table->foreign('id_doc', 'tb_alvara_tb_doc_fk')->references('id_doc')->on('tb_doc');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_alvara');
    }
};
