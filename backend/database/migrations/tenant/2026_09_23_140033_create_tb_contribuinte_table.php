<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Tabela `tb_contribuinte` do sistema legado (schema `public`), no banco de cada prefeitura.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tb_contribuinte', function (Blueprint $table) {
            $table->bigIncrements('id_contribuinte');
            $table->string('status', 1);
            $table->string('tipo', 1);
            $table->string('cpf_cnpj', 14);
            $table->date('data_abertura')->nullable();
            $table->string('regime_tributario', 1)->nullable()->comment('SIAT || OPT SIMPLES || STW 0 | true | S - Simples Nacional 5 | true | M - MEI 0 | false | N - Normal 7 | false | A - Avulso');
            $table->integer('porte_empresa')->nullable();
            $table->string('nome', 150);
            $table->string('nome_fantasia', 100)->nullable();
            $table->string('inscricao_municipal', 20)->nullable();
            $table->string('inscricao_estadual', 20)->nullable();
            $table->string('inscricao_cadastro_imob', 13)->nullable();
            $table->string('outro_documento', 30)->nullable();
            $table->string('simples_nacional', 1)->nullable()->default('N');
            $table->string('autonomo_com_tll', 1)->nullable()->default('N');
            $table->text('observacao')->nullable();
            $table->unsignedBigInteger('id_logradouro')->nullable();
            $table->decimal('tll_area_comercial', 18, 2)->nullable();
            $table->decimal('tll_numero_empregados', 18, 0)->nullable();
            $table->decimal('tll_hoteis_numero_quartos', 18, 0)->nullable();
            $table->decimal('tll_hospitais_numero_leitos', 18, 0)->nullable();
            $table->decimal('tll_barbeiro_numero_cadeiras', 18, 0)->nullable();
            $table->decimal('tll_cinema_teatro_num_lugares', 18, 0)->nullable();
            $table->decimal('tll_ensino_numero_salas', 18, 0)->nullable();
            $table->decimal('tll_jogos_numero_mesas', 18, 0)->nullable();
            $table->decimal('tll_jogos_numero_pistas', 18, 0)->nullable();
            $table->decimal('tll_jogos_numero_aparelhos', 18, 0)->nullable();
            $table->unsignedBigInteger('id_empresa');
            $table->integer('id_user')->nullable();
            $table->string('first_phone', 20)->nullable();
            $table->string('second_phone', 20)->nullable();
            $table->date('dt_nasc')->nullable();
            $table->string('email', 255)->nullable();
            $table->integer('id_origem')->nullable();
            $table->integer('regime_trib_especial')->nullable()->comment('0- nenhum; 1- ato cooperado; 2- estimativa; 3- microempresa municipal; 4- notário ou registrador; 5- profissional autônomo; 6- Sociedade de profissionais;');
            $table->integer('regime_apuracao_simples')->nullable()->comment('1- Apuração dos tributos federais e municipais pelo SN; 2- Apuração dos tributos federais pelo SN e ISSQN por fora do SN; 3- Apuração dos tributos federais e municipais por fora do SN;');
            $table->timestamp('updated_at')->useCurrent();
            $table->unique(['cpf_cnpj', 'id_empresa'], 'tb_contribuinte_cpf_cnpj_id_empresa_key');
            $table->index(['id_empresa', 'nome'], 'idx_contrib_empresa_nome');
            $table->index(['id_empresa', 'status'], 'idx_contrib_empresa_status');
            $table->foreign('id_empresa', 'tb_contribuinte_id_empresa_fkey')->references('id_empresa')->on('tb_empresa');
            $table->foreign('id_logradouro', 'tb_contribuinte_id_logradouro_fkey')->references('id_endereco')->on('tb_endereco');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tb_contribuinte');
    }
};
