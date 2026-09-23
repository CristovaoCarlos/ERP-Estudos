<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_iptu_lotes` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_iptu_lotes', function (Blueprint $table) {
            $table->increments('id_lote');
            $table->string('descricao', 100)->nullable();
            $table->date('data_lancamento');
            $table->date('data_vencimento_cota_unica');
            $table->date('data_vencimento_1a_parcela')->nullable();
            $table->date('data_vencimento_2a_parcela')->nullable();
            $table->date('data_vencimento_3a_parcela')->nullable();
            $table->integer('faixa_inicial_distrito');
            $table->integer('faixa_inicial_setor')->nullable();
            $table->integer('faixa_inicial_quadra')->nullable();
            $table->integer('faixa_inicial_lote')->nullable();
            $table->integer('faixa_inicial_unidade')->nullable();
            $table->integer('faixa_final_distrito');
            $table->integer('faixa_final_setor')->nullable();
            $table->integer('faixa_final_quadra')->nullable();
            $table->integer('faixa_final_lote')->nullable();
            $table->integer('faixa_final_unidade')->nullable();
            $table->string('status', 1);
            $table->timestamp('status_datahora');
            $table->string('status_usuario', 20);
            $table->integer('qtd_lancamentos')->nullable();
            $table->decimal('valor_processado', 18, 2)->nullable();
            $table->decimal('valor_emitido', 18, 2)->nullable();
            $table->decimal('valor_isento', 18, 2)->nullable();
            $table->integer('qtd_novo')->nullable();
            $table->integer('qtd_processado')->nullable();
            $table->integer('qtd_emitido')->nullable();
            $table->integer('qtd_inconsistente')->nullable();
            $table->integer('qtd_isento')->nullable();
            $table->integer('qtd_cancelado')->nullable();
            $table->string('dam_linha1', 40)->nullable();
            $table->string('dam_linha2', 100)->nullable();
            $table->integer('id_empresa');
            $table->integer('id_origem')->nullable();
            $table->integer('id_parametro_iptu');
            $table->foreign('id_empresa', 'tb_iptu_lotes_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
            $table->foreign('id_parametro_iptu', 'tb_iptu_lotes_id_parametro_iptu_fkey')->references('id_parametro_imovel_iptu')->on('tb_parametros_imovel_iptu');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_iptu_lotes');
    }
};
