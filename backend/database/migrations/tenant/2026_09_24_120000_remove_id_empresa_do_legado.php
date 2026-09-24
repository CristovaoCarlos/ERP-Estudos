<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Remove `id_empresa` das tabelas herdadas do legado e a tabela `tb_empresa` (ADR-0013).
 *
 * No legado, um banco guardava todas as prefeituras e `id_empresa` separava uma da outra. No STM
 * cada prefeitura tem o seu banco, então a coluna não separa nada. Índices com `id_empresa` e mais
 * colunas são recriados só com as outras colunas: um `unique (codigo, id_empresa)` vira
 * `unique (codigo)`, que tem o mesmo efeito dentro do banco da prefeitura.
 *
 * O `down()` devolve a estrutura (coluna aceitando null, porque as linhas existentes não têm
 * empresa), não os dados.
 */
return new class extends Migration
{
    /**
     * Tabela => [tipo da coluna, aceita null, chave estrangeira, índices com a coluna].
     * Índice: nome => [unique?, colunas (com `id_empresa`), nome do índice recriado sem ela].
     *
     * @var array<string, array{0: string, 1: bool, 2: ?string, 3: array<string, array{0: bool, 1: list<string>, 2: ?string}>}>
     */
    private array $tabelas = [
        'tb_alvara_tipo' => ['integer', true, null, []],
        'tb_base_legal' => ['integer', false, null, []],
        'tb_cartorio' => ['integer', false, null, []],
        'tb_certidao_negativa' => ['integer', true, 'tb_certidao_negativa_id_empresa_fkey', []],
        'tb_contribuinte' => ['integer', false, 'tb_contribuinte_id_empresa_fkey', [
            'tb_contribuinte_cpf_cnpj_id_empresa_key' => [true, ['cpf_cnpj', 'id_empresa'], 'tb_contribuinte_cpf_cnpj_key'],
            'idx_contrib_empresa_nome' => [false, ['id_empresa', 'nome'], 'idx_contrib_nome'],
            'idx_contrib_empresa_status' => [false, ['id_empresa', 'status'], 'idx_contrib_status'],
        ]],
        'tb_convenio' => ['integer', false, 'tb_convenio_id_empresa_fkey', []],
        'tb_dados_sociais_imovel' => ['integer', false, null, [
            'idx_dados_sociais_empresa' => [false, ['id_empresa'], null],
        ]],
        'tb_doc' => ['bigInteger', false, 'tb_doc_tb_empresa_fk', [
            'idx_tb_doc_empresa_tipo' => [false, ['id_empresa', 'tipo'], 'idx_tb_doc_tipo'],
            'idx_tb_doc_empresa_tipo_doc' => [false, ['id_empresa', 'tipo', 'id_doc'], 'idx_tb_doc_tipo_doc'],
        ]],
        'tb_fator_localizacao' => ['integer', false, null, []],
        'tb_habite_impressao' => ['integer', true, null, []],
        'tb_imovel' => ['integer', false, 'tb_imovel_id_empresa_fkey', [
            'idx_imovel_empresa_inscricao' => [false, ['id_empresa', 'inscricao_setor', 'inscricao_quadra', 'inscricao_lote', 'inscricao_unidade'], 'idx_imovel_inscricao'],
            'idx_imovel_empresa_prop' => [false, ['id_empresa', 'id_proprietario'], 'idx_imovel_prop'],
            'idx_imovel_empresa_tipo' => [false, ['id_empresa', 'tipo_imovel'], 'idx_imovel_tipo'],
        ]],
        'tb_inss' => ['integer', false, null, []],
        'tb_iptu_lotes' => ['integer', false, 'tb_iptu_lotes_id_empresa_fkey', []],
        'tb_ir' => ['integer', false, null, [
            'idx_tb_ir_empresa_data_desc' => [false, ['id_empresa', 'data'], 'idx_tb_ir_data_desc'],
        ]],
        'tb_isencao' => ['integer', false, null, []],
        'tb_itbi_impressao' => ['integer', true, null, []],
        'tb_levantamento_drone' => ['integer', false, null, [
            'idx_levantamento_empresa' => [false, ['id_empresa'], null],
        ]],
        'tb_modeldo_historico_nota_fsical' => ['bigInteger', false, null, []],
        'tb_modelo_certidao_negativa' => ['integer', false, null, []],
        'tb_natureza_itbi' => ['integer', false, null, [
            'tb_natureza_itbi_codigo_id_empresa_key' => [true, ['codigo', 'id_empresa'], 'tb_natureza_itbi_codigo_key'],
        ]],
        'tb_negociacao' => ['integer', false, 'tb_negociacao_id_empresa_fkey', []],
        'tb_parametro_alvara' => ['bigInteger', false, null, []],
        'tb_parametro_certidao_negativa' => ['bigInteger', false, null, []],
        'tb_parametro_habite' => ['bigInteger', false, null, []],
        'tb_parametro_itbi' => ['bigInteger', false, null, []],
        'tb_parametro_nota_fiscal' => ['bigInteger', false, 'tb_parametro_nota_fiscal_id_empresa_fkey', [
            'uq_tb_parametro_nota_fiscal_empresa' => [true, ['id_empresa'], null],
        ]],
        'tb_parametro_receita' => ['integer', false, 'tb_parametro_receita_id_empresa_fkey', [
            'tb_parametro_receita_id_empresa_key' => [true, ['id_empresa'], null],
        ]],
        'tb_parametros' => ['integer', false, 'tb_parametros_id_empresa_fkey', [
            'tb_parametros_unique' => [true, ['id_empresa'], null],
        ]],
        'tb_parametros_gestores' => ['integer', false, 'tb_parametros_gestores_id_empresa_fkey', []],
        'tb_parametros_imovel_iptu' => ['integer', false, 'tb_parametros_imovel_iptu_id_empresa_fkey', [
            'idx_tb_parametros_imovel_iptu_empresa' => [false, ['id_empresa', 'exercicio'], 'idx_tb_parametros_imovel_iptu_exercicio'],
        ]],
        'tb_parametros_multas_juros' => ['integer', false, null, []],
        'tb_processing' => ['integer', true, null, [
            'idx_tb_processing_iptu_lote' => [false, ['id_empresa', 'iptu_lote_id', 'id'], 'idx_tb_processing_lote_iptu'],
        ]],
        'tb_receita' => ['integer', false, 'tb_receita_id_empresa_fkey', []],
        'tb_retorno_bancario' => ['integer', false, null, []],
        'tb_servico' => ['integer', false, 'tb_servico_id_empresa_fkey', [
            'tb_servico_codigo_servico_id_empresa_key' => [true, ['codigo_servico', 'id_empresa'], 'tb_servico_codigo_servico_key'],
        ]],
        'tb_tomador' => ['integer', false, 'tb_tomador_id_empresa_fkey', []],
        'tb_tomador_internacional' => ['bigInteger', true, 'tb_tomador_internacional_id_empresa_fkey', []],
        'tb_ufir' => ['integer', false, null, []],
    ];

    /** Índices por expressão de `tb_processing` (só PostgreSQL): versão com e sem `id_empresa`. */
    private const LOTE_ATIVO = "WHERE ((parametros IS NOT NULL) AND ((name_process)::text = ANY (ARRAY[('PROCESS_LOTE'::character varying)::text, ('CRIAR_DAMS_LOTE'::character varying)::text])) AND ((status)::text = ANY (ARRAY[('IN QUEUE'::character varying)::text, ('PROCESSING'::character varying)::text])))";

    public function up(): void
    {
        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS idx_tb_processing_lote');
            DB::statement('DROP INDEX IF EXISTS uq_processing_iptu_ativo');
            DB::statement("CREATE INDEX idx_tb_processing_lote ON tb_processing USING btree (((parametros ->> 'id_lote'::text))) WHERE (parametros IS NOT NULL)");
            DB::statement("CREATE UNIQUE INDEX uq_processing_iptu_ativo ON tb_processing USING btree (((parametros ->> 'id_lote'::text))) ".self::LOTE_ATIVO);
        }

        foreach ($this->tabelas as $tabela => [, , $chave, $indices]) {
            // Chave e índices saem antes da coluna (o SQLite não apaga coluna indexada).
            Schema::table($tabela, function (Blueprint $table) use ($chave, $indices) {
                // O SQLite (testes) só acha a chave pela coluna; o PostgreSQL, pelo nome.
                if ($chave) {
                    $table->dropForeign(DB::getDriverName() === 'sqlite' ? ['id_empresa'] : $chave);
                }
                foreach ($indices as $nome => [$unico]) {
                    $unico ? $table->dropUnique($nome) : $table->dropIndex($nome);
                }
            });

            Schema::table($tabela, fn (Blueprint $table) => $table->dropColumn('id_empresa'));

            Schema::table($tabela, function (Blueprint $table) use ($indices) {
                foreach ($indices as [$unico, $colunas, $novo]) {
                    if ($novo) {
                        $restantes = array_values(array_diff($colunas, ['id_empresa']));
                        $unico ? $table->unique($restantes, $novo) : $table->index($restantes, $novo);
                    }
                }
            });
        }

        Schema::drop('tb_empresa');
    }

    public function down(): void
    {
        Schema::create('tb_empresa', function (Blueprint $table) {
            $table->bigIncrements('id_empresa');
            $table->string('cnpj_empresa', 14);
            $table->text('razao_social');
            $table->string('use_license', 1)->nullable()->default('S');
            $table->unique(['cnpj_empresa'], 'tb_empresa_cnpj_empresa_key');
        });

        foreach ($this->tabelas as $tabela => [$tipo, , $chave, $indices]) {
            Schema::table($tabela, function (Blueprint $table) use ($indices) {
                foreach ($indices as [$unico, , $novo]) {
                    if ($novo) {
                        $unico ? $table->dropUnique($novo) : $table->dropIndex($novo);
                    }
                }
            });

            Schema::table($tabela, function (Blueprint $table) use ($tipo, $chave, $indices) {
                $table->{$tipo}('id_empresa')->nullable();
                foreach ($indices as $nome => [$unico, $colunas]) {
                    $unico ? $table->unique($colunas, $nome) : $table->index($colunas, $nome);
                }
                if ($chave) {
                    $table->foreign('id_empresa', $chave)->references('id_empresa')->on('tb_empresa');
                }
            });
        }

        if (DB::getDriverName() === 'pgsql') {
            DB::statement('DROP INDEX IF EXISTS idx_tb_processing_lote');
            DB::statement('DROP INDEX IF EXISTS uq_processing_iptu_ativo');
            DB::statement("CREATE INDEX idx_tb_processing_lote ON tb_processing USING btree (id_empresa, ((parametros ->> 'id_lote'::text))) WHERE (parametros IS NOT NULL)");
            DB::statement("CREATE UNIQUE INDEX uq_processing_iptu_ativo ON tb_processing USING btree (id_empresa, ((parametros ->> 'id_lote'::text))) ".self::LOTE_ATIVO);
        }
    }
};
