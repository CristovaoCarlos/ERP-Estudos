<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\TenantConnection;

/**
 * Relatório gerado em segundo plano (tabela `tb_relatorio_gerado`). O controller cria o registro
 * `pendente` e despacha o job; o worker o leva a `processando` e, no fim, a `pronto` ou `falhou`.
 */
class RelatorioGerado extends Model
{
    use TenantConnection;

    public const PENDENTE = 'pendente';

    public const PROCESSANDO = 'processando';

    public const PRONTO = 'pronto';

    public const FALHOU = 'falhou';

    protected $table = 'tb_relatorio_gerado';

    protected $primaryKey = 'id_relatorio_gerado';

    protected $guarded = ['id_relatorio_gerado'];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'filtros' => 'array',
            'concluido_em' => 'datetime',
        ];
    }

    /** O que a tela precisa para acompanhar o pedido. */
    public function paraApi(): array
    {
        return [
            'id' => $this->id_relatorio_gerado,
            'situacao' => $this->situacao,
            'erro' => $this->erro,
            'concluido_em' => $this->concluido_em?->toIso8601String(),
        ];
    }
}
