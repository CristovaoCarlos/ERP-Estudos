<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Stancl\Tenancy\Database\Concerns\CentralConnection;

/**
 * Atividade da CNAE (tabela `ti_cnae` do legado), no banco central. Cada linha é um nível da
 * hierarquia: seção › divisão › grupo › classe › subclasse. Guarda as versões 2.2 e 2.3.
 */
class Cnae extends Model
{
    use CentralConnection;

    /** Níveis, do mais geral ao mais específico: nível => coluna do código dele. */
    public const NIVEIS = [
        'secao' => 'sessao',
        'divisao' => 'divisao',
        'grupo' => 'grupo',
        'classe' => 'classe',
        'subclasse' => 'subclasse',
    ];

    protected $table = 'ti_cnae';

    protected $primaryKey = 'codigo';

    public $timestamps = false;

    protected $guarded = ['codigo'];

    protected $casts = ['ativo' => 'boolean'];

    /** O nível mais específico preenchido na linha (o legado grava vazio ou null nos demais). */
    public function nivel(): string
    {
        foreach (array_reverse(self::NIVEIS, true) as $nivel => $coluna) {
            if (filled($this->{$coluna})) {
                return $nivel;
            }
        }

        return 'secao';
    }
}
