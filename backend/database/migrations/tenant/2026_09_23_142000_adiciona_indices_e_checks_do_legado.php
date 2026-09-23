<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Índices parciais (com `WHERE`), por expressão ou com `INCLUDE`, e as restrições `CHECK` do
 * sistema legado: o Blueprint não sabe descrevê-los, então vão em SQL.
 *
 * Só rodam no PostgreSQL; nos testes (SQLite, ADR-0006) são ignorados.
 */
return new class extends Migration
{
    /** Índice => SQL de criação. @var array<string, string> */
    private array $indices = [
        'idx_dam_lock_checked_pix_at' => 'CREATE INDEX idx_dam_lock_checked_pix_at ON tb_dam USING btree (checked_pix_at DESC) WHERE (lock = true)',
        'idx_tb_dam_contribuinte_aberto' => 'CREATE INDEX idx_tb_dam_contribuinte_aberto ON tb_dam USING btree (id_contribuinte) WHERE ((status)::text = \'L\'::text)',
        'idx_tb_dam_pix_pendente' => 'CREATE INDEX idx_tb_dam_pix_pendente ON tb_dam USING btree (checked_pix_at NULLS FIRST) WHERE ((pix_referencia IS NOT NULL) AND ((status)::text = ANY (ARRAY[(\'L\'::character varying)::text, (\'C\'::character varying)::text])))',
        'idx_tb_dam_vencimento_aberto' => 'CREATE INDEX idx_tb_dam_vencimento_aberto ON tb_dam USING btree (data_vencimento) WHERE ((status)::text = \'L\'::text)',
        'idx_tb_iptu_lancamentos_lote_status' => 'CREATE INDEX idx_tb_iptu_lancamentos_lote_status ON tb_iptu_lancamentos USING btree (id_lote, status) INCLUDE (iptu_valor)',
        'idx_tb_processing_fila' => 'CREATE INDEX idx_tb_processing_fila ON tb_processing USING btree (id) WHERE (((status)::text = ANY (ARRAY[(\'IN QUEUE\'::character varying)::text, (\'PROCESSING\'::character varying)::text])) AND (parametros IS NOT NULL))',
        'idx_tb_processing_lote' => 'CREATE INDEX idx_tb_processing_lote ON tb_processing USING btree (id_empresa, ((parametros ->> \'id_lote\'::text))) WHERE (parametros IS NOT NULL)',
        'ix_mqmessages_priority' => 'CREATE INDEX ix_mqmessages_priority ON mq_messages USING btree (queue_id, status, priority) WITH (fillfactor=\'100\', deduplicate_items=\'true\')',
        'uq_processing_iptu_ativo' => 'CREATE UNIQUE INDEX uq_processing_iptu_ativo ON tb_processing USING btree (id_empresa, ((parametros ->> \'id_lote\'::text))) WHERE ((parametros IS NOT NULL) AND ((name_process)::text = ANY (ARRAY[(\'PROCESS_LOTE\'::character varying)::text, (\'CRIAR_DAMS_LOTE\'::character varying)::text])) AND ((status)::text = ANY (ARRAY[(\'IN QUEUE\'::character varying)::text, (\'PROCESSING\'::character varying)::text])))',
    ];

    /** Restrição => SQL de criação. @var array<string, string> */
    private array $checks = [
        'tb_doc_status_check' => 'ALTER TABLE tb_doc ADD CONSTRAINT tb_doc_status_check CHECK (((status)::text = ANY (ARRAY[(\'L\'::character varying)::text, (\'E\'::character varying)::text, (\'C\'::character varying)::text, (\'Q\'::character varying)::text])))',
        'chk_vencimento_tipo' => 'ALTER TABLE tb_parametro_nota_fiscal ADD CONSTRAINT chk_vencimento_tipo CHECK (((vencimento_tipo)::text = ANY (ARRAY[(\'A\'::character varying)::text, (\'D\'::character varying)::text])))',
        'chk_vencimento_valor' => 'ALTER TABLE tb_parametro_nota_fiscal ADD CONSTRAINT chk_vencimento_valor CHECK (((((vencimento_tipo)::text = \'D\'::text) AND ((vencimento_valor >= 1) AND (vencimento_valor <= 31))) OR (((vencimento_tipo)::text <> \'D\'::text) AND ((vencimento_valor IS NULL) OR (vencimento_valor < 999)))))',
    ];

    /** Restrição => tabela, para removê-las no rollback. @var array<string, string> */
    private array $tabelaDoCheck = [
        'tb_doc_status_check' => 'tb_doc',
        'chk_vencimento_tipo' => 'tb_parametro_nota_fiscal',
        'chk_vencimento_valor' => 'tb_parametro_nota_fiscal',
    ];

    public function up(): void
    {
        if (! $this->noPostgres()) {
            return;
        }

        foreach ([...array_values($this->indices), ...array_values($this->checks)] as $sql) {
            DB::statement($sql);
        }
    }

    public function down(): void
    {
        if (! $this->noPostgres()) {
            return;
        }

        foreach ($this->tabelaDoCheck as $restricao => $tabela) {
            DB::statement("ALTER TABLE {$tabela} DROP CONSTRAINT IF EXISTS {$restricao}");
        }

        foreach (array_keys($this->indices) as $indice) {
            DB::statement("DROP INDEX IF EXISTS {$indice}");
        }
    }

    private function noPostgres(): bool
    {
        return DB::connection()->getDriverName() === 'pgsql';
    }
};
