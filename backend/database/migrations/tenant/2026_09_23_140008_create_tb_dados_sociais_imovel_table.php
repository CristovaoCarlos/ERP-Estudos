<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_dados_sociais_imovel` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_dados_sociais_imovel', function (Blueprint $table) {
            $table->increments('id_dados_sociais');
            $table->integer('id_imovel');
            $table->integer('id_empresa');
            $table->smallInteger('qtd_moradores')->nullable();
            $table->smallInteger('qtd_criancas')->nullable();
            $table->smallInteger('qtd_adolescentes')->nullable();
            $table->smallInteger('qtd_adultos')->nullable();
            $table->smallInteger('qtd_idosos')->nullable();
            $table->decimal('renda_familiar', 10, 2)->nullable();
            $table->char('faixa_renda', 1)->nullable();
            $table->smallInteger('qtd_pessoas_renda')->nullable();
            $table->string('material_paredes', 30)->nullable();
            $table->string('tipo_cobertura', 30)->nullable();
            $table->smallInteger('qtd_comodos')->nullable();
            $table->char('condicao_imovel', 1)->nullable();
            $table->boolean('possui_banheiro')->default(true);
            $table->text('observacoes')->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->timestamp('updated_at')->useCurrent();
            $table->unique(['id_imovel'], 'uq_dados_sociais_imovel');
            $table->index(['id_empresa'], 'idx_dados_sociais_empresa');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_dados_sociais_imovel');
    }
};
