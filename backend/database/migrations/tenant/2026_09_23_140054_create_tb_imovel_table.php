<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_imovel` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_imovel', function (Blueprint $table) {
            $table->integer('inscricao_distrito')->nullable();
            $table->integer('inscricao_setor')->nullable();
            $table->integer('inscricao_quadra')->nullable();
            $table->integer('inscricao_lote')->nullable();
            $table->integer('inscricao_unidade')->nullable();
            $table->integer('id_proprietario')->nullable();
            $table->string('proprietario_tipo', 1)->nullable();
            $table->string('proprietario_cpf_cnpj', 14)->nullable();
            $table->string('proprietario_nome', 255)->nullable();
            $table->integer('logradouro_id');
            $table->integer('correspondencia_id')->nullable();
            $table->bigIncrements('id_imovel');
            $table->integer('id_empresa');
            $table->text('motivo_cancelamento')->nullable();
            $table->integer('id_fator_localizacao');
            $table->string('senha_web', 10)->nullable();
            $table->integer('id_origem')->nullable();
            $table->string('tipo_imovel', 1)->default('U')->comment('U - Urbano R - Rural');
            $table->string('status', 1)->default('A')->comment('A- Ativo C- Cancelado');
            $table->date('data_cancelamento')->nullable();
            $table->timestamp('updated_at')->useCurrent();
            $table->index(['id_empresa', 'inscricao_setor', 'inscricao_quadra', 'inscricao_lote', 'inscricao_unidade'], 'idx_imovel_empresa_inscricao');
            $table->index(['id_empresa', 'id_proprietario'], 'idx_imovel_empresa_prop');
            $table->index(['id_empresa', 'tipo_imovel'], 'idx_imovel_empresa_tipo');
            $table->index(['id_proprietario', 'id_fator_localizacao', 'logradouro_id'], 'idx_tb_imovel_id_prop');
            $table->foreign('correspondencia_id', 'tb_imovel_correspondencia_id_fkey')->references('id_endereco')->on('tb_endereco');
            $table->foreign('id_empresa', 'tb_imovel_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
            $table->foreign('id_fator_localizacao', 'tb_imovel_id_fator_localizacao_fkey')->references('id_fator_localizacao')->on('tb_fator_localizacao');
            $table->foreign('id_proprietario', 'tb_imovel_id_proprietario_fkey')->references('id_contribuinte')->on('tb_contribuinte');
            $table->foreign('logradouro_id', 'tb_imovel_logradouro_id_fkey')->references('id_endereco')->on('tb_endereco');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_imovel');
    }
};
