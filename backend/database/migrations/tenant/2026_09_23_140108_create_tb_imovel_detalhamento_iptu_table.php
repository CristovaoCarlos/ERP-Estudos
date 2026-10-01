<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_imovel_detalhamento_iptu` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_imovel_detalhamento_iptu', function (Blueprint $table) {
            $table->bigIncrements('id_imovel_detalhamento_iptu');
            $table->decimal('area_terreno', 18, 2)->nullable();
            $table->decimal('area_unidade', 18, 2)->nullable();
            $table->decimal('area_total_edificacao', 18, 2)->nullable();
            $table->integer('qtd_pavimentos_edificacao')->nullable();
            $table->decimal('testada_imovel', 18, 2)->nullable();
            $table->integer('fator_ocupacao')->nullable();
            $table->integer('fator_topografia')->nullable();
            $table->integer('fator_situacao_terreno')->nullable();
            $table->integer('fator_pedologia')->nullable();
            $table->integer('fator_utilizacao')->nullable();
            $table->integer('fator_patrimonio')->nullable();
            $table->integer('fator_isento_iptu')->nullable();
            $table->integer('fator_isento_tsu')->nullable();
            $table->integer('fator_uso_imovel')->nullable();
            $table->integer('fator_limitacao')->nullable();
            $table->integer('fator_caracterizacao')->nullable();
            $table->integer('fator_revestimento_externo')->nullable();
            $table->integer('fator_piso')->nullable();
            $table->integer('fator_forro')->nullable();
            $table->integer('fator_cobertura')->nullable();
            $table->integer('fator_instalacao_sanitaria')->nullable();
            $table->integer('fator_tipo_construcao')->nullable();
            $table->integer('fator_estrutura')->nullable();
            $table->integer('fator_estado_conservacao')->nullable();
            $table->integer('fator_instalacao_eletrica')->nullable();
            $table->unsignedInteger('id_isencao')->nullable();
            $table->string('su_calcamento', 1);
            $table->string('su_calcamento_tipo', 30)->nullable();
            $table->decimal('su_calcamento_testada', 18, 2)->nullable();
            $table->string('su_iluminacao', 1);
            $table->decimal('su_iluminacao_testada', 18, 2)->nullable();
            $table->string('su_limpeza', 1);
            $table->decimal('su_limpeza_testada', 18, 2)->nullable();
            $table->string('su_agua', 1);
            $table->string('su_coleta_lixo', 1);
            $table->string('su_esgoto', 1);
            $table->string('su_sarjeta', 1);
            $table->string('su_galeria_pluvial', 1);
            $table->string('su_telefone', 1);
            $table->string('su_fossa', 1);
            $table->string('su_poco', 1);
            $table->date('foro_data_expedicao')->nullable();
            $table->string('foro_livro_registro_numero', 20)->nullable();
            $table->string('foro_livro_registro_folha', 20)->nullable();
            $table->integer('foro_proprietario_tipo')->nullable();
            $table->string('gleba', 1)->default('N');
            $table->integer('fator_posicao_fachada')->nullable();
            $table->unsignedBigInteger('id_imovel');
            $table->timestamp('data')->useCurrent();
            $table->index(['id_imovel'], 'idx_tb_imovel_detalhamento_iptu_id_imovel');
            $table->foreign('id_imovel', 'tb_imovel_detalhamento_iptu_id_imovel_fkey')->references('id_imovel')->on('tb_imovel');
            $table->foreign('id_isencao', 'tb_imovel_detalhamento_iptu_id_isencao_fkey')->references('id_isencao')->on('tb_isencao');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_imovel_detalhamento_iptu');
    }
};
