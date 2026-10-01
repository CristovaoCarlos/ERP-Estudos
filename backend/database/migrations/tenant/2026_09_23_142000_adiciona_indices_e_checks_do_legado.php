<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

/**
 * Índices por expressão (sobre o JSON de `tb_processing`) e as restrições `CHECK` do sistema
 * legado: o Blueprint não sabe descrevê-los, então vão em SQL.
 *
 * O legado (PostgreSQL) usava índices parciais (`WHERE`) e com `INCLUDE`, que o MySQL não tem:
 * aqui a condição vira coluna à esquerda do índice, e o índice único parcial de lote ativo vira
 * índice único sobre uma expressão que dá `NULL` fora da condição (o MySQL aceita vários `NULL`).
 *
 * Só rodam no MySQL; nos testes (SQLite, ADR-0006) são ignorados.
 */
return new class extends Migration
{
    /** Lote de `tb_processing`, como texto. */
    private const LOTE = "CAST(parametros->>'$.id_lote' AS CHAR(64)) COLLATE utf8mb4_bin";

    /** Índice => [tabela, SQL de criação]. @var array<string, array{0: string, 1: string}> */
    private array $indices = [
        'idx_dam_lock_checked_pix_at' => ['tb_dam', 'CREATE INDEX idx_dam_lock_checked_pix_at ON tb_dam (`lock`, checked_pix_at DESC)'],
        'idx_tb_dam_contribuinte_aberto' => ['tb_dam', 'CREATE INDEX idx_tb_dam_contribuinte_aberto ON tb_dam (status, id_contribuinte)'],
        'idx_tb_dam_pix_pendente' => ['tb_dam', 'CREATE INDEX idx_tb_dam_pix_pendente ON tb_dam (status, checked_pix_at)'],
        'idx_tb_dam_vencimento_aberto' => ['tb_dam', 'CREATE INDEX idx_tb_dam_vencimento_aberto ON tb_dam (status, data_vencimento)'],
        'idx_tb_iptu_lancamentos_lote_status' => ['tb_iptu_lancamentos', 'CREATE INDEX idx_tb_iptu_lancamentos_lote_status ON tb_iptu_lancamentos (id_lote, status, iptu_valor)'],
        'idx_tb_processing_fila' => ['tb_processing', 'CREATE INDEX idx_tb_processing_fila ON tb_processing (status, id)'],
        'idx_tb_processing_lote' => ['tb_processing', 'CREATE INDEX idx_tb_processing_lote ON tb_processing (('.self::LOTE.'))'],
        'ix_mqmessages_priority' => ['mq_messages', 'CREATE INDEX ix_mqmessages_priority ON mq_messages (queue_id, status, priority)'],
        'uq_processing_iptu_ativo' => ['tb_processing', "CREATE UNIQUE INDEX uq_processing_iptu_ativo ON tb_processing ((CASE WHEN parametros IS NOT NULL AND name_process IN ('PROCESS_LOTE', 'CRIAR_DAMS_LOTE') AND status IN ('IN QUEUE', 'PROCESSING') THEN ".self::LOTE.' END))'],
    ];

    /** Restrição => [tabela, SQL de criação]. @var array<string, array{0: string, 1: string}> */
    private array $checks = [
        'tb_doc_status_check' => ['tb_doc', "ALTER TABLE tb_doc ADD CONSTRAINT tb_doc_status_check CHECK (status IN ('L', 'E', 'C', 'Q'))"],
        'chk_vencimento_tipo' => ['tb_parametro_nota_fiscal', "ALTER TABLE tb_parametro_nota_fiscal ADD CONSTRAINT chk_vencimento_tipo CHECK (vencimento_tipo IN ('A', 'D'))"],
        'chk_vencimento_valor' => ['tb_parametro_nota_fiscal', "ALTER TABLE tb_parametro_nota_fiscal ADD CONSTRAINT chk_vencimento_valor CHECK ((vencimento_tipo = 'D' AND vencimento_valor BETWEEN 1 AND 31) OR (vencimento_tipo <> 'D' AND (vencimento_valor IS NULL OR vencimento_valor < 999)))"],
    ];

    public function up(): void
    {
        if (! $this->noMysql()) {
            return;
        }

        foreach ([...$this->indices, ...$this->checks] as [, $sql]) {
            DB::statement($sql);
        }
    }

    public function down(): void
    {
        if (! $this->noMysql()) {
            return;
        }

        foreach ($this->checks as $restricao => [$tabela]) {
            DB::statement("ALTER TABLE {$tabela} DROP CHECK {$restricao}");
        }

        foreach ($this->indices as $indice => [$tabela]) {
            DB::statement("DROP INDEX {$indice} ON {$tabela}");
        }
    }

    private function noMysql(): bool
    {
        return DB::connection()->getDriverName() === 'mysql';
    }
};
